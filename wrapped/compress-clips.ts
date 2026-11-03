/**
 * Re-encodes the deck's video clips for the web, into a side folder for review. Never
 * touches the originals in public/.
 *
 *   pnpm wrapped:compress                      every clip the deck plays, at CRF 24 and 28
 *   pnpm wrapped:compress --crf 22,26,30       pick the quality levels to compare
 *   pnpm wrapped:compress --only prizes,nugget clips whose path contains any of these
 *   pnpm wrapped:compress --height 1280        also downscale (default: keep 1080x1920)
 *   pnpm wrapped:compress --all                every mp4 under public/assets/wrapped
 *   pnpm wrapped:compress --no-ssim            skip the quality score (faster)
 *   pnpm wrapped:compress --crf 24 --no-ssim --out public/assets/wrapped/compressed
 *                                              the upload set for Firebase Storage
 *
 * Writes wrapped/cache/compressed/crf-{n}/{same path as in public} (or `--out`/crf-{n}/…),
 * plus compare.html in the default folder only: each clip's original next to every variant,
 * played in sync, with sizes and SSIM. Open it in Safari and Chrome to judge quality.
 *
 * Needs ffmpeg with libx264 (`brew install ffmpeg`), or set FFMPEG / FFPROBE to binaries.
 *
 * Encoding: H.264 High profile, yuv420p, `+faststart` (playback starts before the whole
 * file arrives), no audio (the deck plays every clip muted). Frame rate, frame count and
 * duration are kept exactly: each clip's Lottie text layer is driven off the video's
 * `currentTime`, so retiming a clip would put the text out of step.
 */

import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

const ROOT = path.resolve(import.meta.dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const CLIPS_DIR = path.join(PUBLIC, "assets/wrapped");
const SCENES = path.join(ROOT, "src/lib/wrapped/scenes.ts");
const DEFAULT_OUT = path.join(ROOT, "wrapped/cache/compressed");

const FFMPEG = process.env.FFMPEG ?? "ffmpeg";
const FFPROBE = process.env.FFPROBE ?? "ffprobe";

interface Probe {
  width: number;
  height: number;
  fps: string;
  frames: number;
  duration: number;
  bitrateKbps: number;
}

interface Variant {
  crf: number;
  file: string;
  bytes: number;
  probe: Probe;
  ssim: number | null;
}

interface ClipResult {
  rel: string;
  bytes: number;
  probe: Probe;
  variants: Variant[];
}

function run(cmd: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", (error) =>
      reject(
        (error as NodeJS.ErrnoException).code === "ENOENT"
          ? new Error(`${cmd} not found. Install ffmpeg (brew install ffmpeg) or set FFMPEG/FFPROBE.`)
          : error,
      ),
    );
    child.on("close", (code) =>
      code === 0
        ? resolve({ stdout, stderr })
        : reject(new Error(`${cmd} exited ${code}:\n${stderr.split("\n").slice(-15).join("\n")}`)),
    );
  });
}

async function probe(file: string): Promise<Probe> {
  const { stdout } = await run(FFPROBE, [
    "-v", "error",
    "-select_streams", "v:0",
    "-count_packets",
    "-show_entries", "stream=width,height,avg_frame_rate,nb_read_packets:format=duration,bit_rate",
    "-of", "json",
    file,
  ]);
  const json = JSON.parse(stdout);
  const stream = json.streams[0];
  return {
    width: stream.width,
    height: stream.height,
    fps: stream.avg_frame_rate,
    frames: Number(stream.nb_read_packets),
    duration: Number(json.format.duration),
    bitrateKbps: Math.round(Number(json.format.bit_rate) / 1000),
  };
}

/** The clips the deck plays: every `clip("….mp4")` in scenes.ts. */
async function deckClips(): Promise<string[]> {
  const source = await fs.readFile(SCENES, "utf8");
  const clips = [...source.matchAll(/\bclip\("([^"]+\.mp4)"\)/g)].map((m) => m[1]);
  if (clips.length === 0) throw new Error(`No clips found in ${SCENES}; has clip() been renamed?`);
  return [...new Set(clips)];
}

async function allClips(): Promise<string[]> {
  const entries = await fs.readdir(CLIPS_DIR, { recursive: true });
  // Skips earlier output written under public/ with --out.
  return entries.filter((entry) => entry.endsWith(".mp4") && !entry.startsWith("compressed/")).sort();
}

async function encode(input: string, output: string, crf: number, height: number | null) {
  await fs.mkdir(path.dirname(output), { recursive: true });
  await run(FFMPEG, [
    "-y", "-v", "error",
    "-i", input,
    "-map", "0:v:0",
    "-an",
    "-c:v", "libx264",
    "-preset", "slow",
    "-crf", String(crf),
    "-profile:v", "high",
    "-pix_fmt", "yuv420p",
    // Keep every source frame and its timing, so the Lottie overlay stays in step.
    "-fps_mode", "passthrough",
    ...(height ? ["-vf", `scale=-2:${height}:flags=lanczos`] : []),
    "-movflags", "+faststart",
    output,
  ]);
}

/** SSIM against the original (1 = identical; above ~0.98 is usually indistinguishable). */
async function ssim(original: string, variant: string, size: Probe): Promise<number | null> {
  // A downscaled variant is scaled back up so the frames line up.
  const filter = `[1:v]scale=${size.width}:${size.height}:flags=bicubic[v];[0:v][v]ssim`;
  const { stderr } = await run(FFMPEG, ["-v", "info", "-i", original, "-i", variant, "-lavfi", filter, "-f", "null", "-"]);
  const match = stderr.match(/All:([\d.]+)/);
  return match ? Number(match[1]) : null;
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

async function main() {
  const { values } = parseArgs({
    options: {
      crf: { type: "string", default: "24,28" },
      only: { type: "string" },
      height: { type: "string" },
      all: { type: "boolean", default: false },
      "no-ssim": { type: "boolean", default: false },
      out: { type: "string" },
    },
  });
  const crfs = values.crf.split(",").map((value) => Number(value.trim()));
  if (crfs.some((crf) => !Number.isInteger(crf) || crf < 0 || crf > 51)) {
    throw new Error("--crf takes integers 0-51, e.g. --crf 22,26,30");
  }
  const height = values.height ? Number(values.height) : null;
  if (height !== null && (!Number.isInteger(height) || height % 2 !== 0)) {
    throw new Error("--height must be an even integer, e.g. 1280");
  }
  const OUT = values.out ? path.resolve(ROOT, values.out) : DEFAULT_OUT;
  const filters = values.only?.split(",").map((value) => value.trim()).filter(Boolean) ?? [];

  let clips = values.all ? await allClips() : await deckClips();
  if (filters.length > 0) clips = clips.filter((clip) => filters.some((f) => clip.includes(f)));
  if (clips.length === 0) throw new Error("No clips match.");

  const tag = (crf: number) => (height ? `crf-${crf}-h${height}` : `crf-${crf}`);
  console.log(`${clips.length} clips x CRF ${crfs.join(", ")}${height ? ` at ${height}px tall` : ""} -> ${OUT}\n`);

  const results: ClipResult[] = [];
  for (const rel of clips) {
    const input = path.join(CLIPS_DIR, rel);
    const { size: bytes } = await fs.stat(input);
    const source = await probe(input);
    console.log(
      `${rel}  ${mb(bytes)}  ${source.width}x${source.height} ${source.fps}fps ` +
        `${source.duration.toFixed(1)}s ${source.bitrateKbps} kbps`,
    );

    const variants: Variant[] = [];
    for (const crf of crfs) {
      const file = path.join(OUT, tag(crf), rel);
      const started = Date.now();
      await encode(input, file, crf, height);
      const out = await probe(file);
      // Text sync depends on these matching; a mismatch means the clip can't ship.
      if (out.frames !== source.frames || Math.abs(out.duration - source.duration) > 0.05) {
        console.warn(
          `  ! CRF ${crf}: ${out.frames} frames / ${out.duration.toFixed(2)}s vs ` +
            `${source.frames} / ${source.duration.toFixed(2)}s in the original`,
        );
      }
      const score = values["no-ssim"] ? null : await ssim(input, file, source);
      const { size } = await fs.stat(file);
      variants.push({ crf, file, bytes: size, probe: out, ssim: score });
      console.log(
        `  CRF ${String(crf).padEnd(2)}  ${mb(size).padStart(8)}  ` +
          `${String(Math.round((1 - size / bytes) * 100)).padStart(3)}% smaller  ` +
          `${out.bitrateKbps} kbps${score === null ? "" : `  SSIM ${score.toFixed(4)}`}  ` +
          `(${((Date.now() - started) / 1000).toFixed(0)}s)`,
      );
    }
    results.push({ rel, bytes, probe: source, variants });
  }

  const before = results.reduce((sum, r) => sum + r.bytes, 0);
  console.log(`\nTotal original: ${mb(before)}`);
  for (const crf of crfs) {
    const after = results.reduce((sum, r) => sum + (r.variants.find((v) => v.crf === crf)?.bytes ?? 0), 0);
    console.log(`Total CRF ${crf}: ${mb(after)} (${Math.round((1 - after / before) * 100)}% smaller)`);
  }

  // Only beside the review copies: under public/ it would ship with the site.
  if (!values.out) {
    const page = path.join(OUT, "compare.html");
    await fs.writeFile(page, compareHtml(results, page));
    console.log(`\nCompare: ${page}`);
  }
}

/** Every clip's original beside its variants, played and scrubbed together. */
function compareHtml(results: ClipResult[], page: string): string {
  const src = (file: string) => encodeURI(path.relative(path.dirname(page), file));
  const label = (title: string, bytes: number, extra = "") =>
    `<figcaption><b>${title}</b> ${mb(bytes)}${extra}</figcaption>`;
  const rows = results
    .map((r) => {
      const cells = [
        `<figure><video src="${src(path.join(CLIPS_DIR, r.rel))}" muted playsinline preload="auto"></video>${label("Original", r.bytes, ` · ${r.probe.bitrateKbps} kbps`)}</figure>`,
        ...r.variants.map(
          (v) =>
            `<figure><video src="${src(v.file)}" muted playsinline preload="auto"></video>${label(
              `CRF ${v.crf}`,
              v.bytes,
              ` · ${Math.round((1 - v.bytes / r.bytes) * 100)}% smaller${v.ssim === null ? "" : ` · SSIM ${v.ssim.toFixed(4)}`}`,
            )}</figure>`,
        ),
      ].join("");
      return `<section><h2>${r.rel}</h2><div class="controls"><button data-play>Play together</button><button data-pause>Pause</button><input data-seek type="range" min="0" max="1000" value="0"><label><input data-zoom type="checkbox"> 1:1 pixels</label></div><div class="row">${cells}</div></section>`;
    })
    .join("\n");

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Wrapped clip compression</title>
<style>
  body { background: #111; color: #eee; font: 14px system-ui, sans-serif; margin: 24px; }
  section { margin-bottom: 48px; }
  h2 { font-size: 16px; font-weight: 600; }
  .controls { display: flex; gap: 12px; align-items: center; margin-bottom: 8px; }
  .controls input[type=range] { width: 320px; }
  .row { display: flex; gap: 12px; overflow-x: auto; }
  figure { margin: 0; flex: none; }
  video { height: 70vh; aspect-ratio: 9 / 16; background: #000; display: block; }
  .zoom figure { width: 45vw; height: 70vh; overflow: auto; }
  .zoom video { height: 1920px; }
  figcaption { padding-top: 6px; color: #aaa; }
  figcaption b { color: #fff; }
</style></head><body>
<h1>Wrapped clip compression</h1>
<p>Each row plays in sync. Check gradients, glows and fine text for banding or smearing; tick "1:1 pixels" to inspect at full size. SSIM above ~0.98 is usually indistinguishable.</p>
${rows}
<script>
for (const section of document.querySelectorAll("section")) {
  const videos = [...section.querySelectorAll("video")];
  const seek = section.querySelector("[data-seek]");
  const lead = videos[0];
  section.querySelector("[data-play]").onclick = () => {
    for (const v of videos) v.currentTime = lead.currentTime;
    for (const v of videos) v.play();
  };
  section.querySelector("[data-pause]").onclick = () => videos.forEach((v) => v.pause());
  seek.oninput = () => {
    const t = (seek.value / 1000) * (lead.duration || 0);
    for (const v of videos) { v.pause(); v.currentTime = t; }
  };
  lead.ontimeupdate = () => { if (lead.duration) seek.value = (lead.currentTime / lead.duration) * 1000; };
  section.querySelector("[data-zoom]").onchange = (e) => section.classList.toggle("zoom", e.target.checked);
}
</script>
</body></html>
`;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
