import { CodedSlideContent } from "@/components/features/wrapped/coded-slide-content";
import { COMP_HEIGHT, COMP_WIDTH } from "@/components/features/wrapped/comp-canvas";
import type { WrappedDoc } from "@/lib/firebase/types/wrapped";
import {
  LOTTIE_FONT_FAMILY,
  LOTTIE_FONT_WEIGHT,
  setLayerText,
  withWebfont,
} from "@/lib/wrapped/lottie";
import { SCENES, type VideoScene } from "@/lib/wrapped/scenes";
import type { SlideId } from "@/lib/wrapped/slides";
import { toBlob } from "html-to-image";
import lottie from "lottie-web";
import { createRoot } from "react-dom/client";

/**
 * Renders deck slides to 1080x1920 PNGs, for the summary's "share your Wrapped" sheet.
 *
 * Nothing is captured off the live stage — only the current slide and its neighbours are
 * mounted, and they are mid-animation. Each slide is instead drawn fresh, offscreen:
 *  - video slides: one still frame of the clip, with its Lottie text (retexted with the
 *    hacker's numbers) drawn over it by lottie-web's canvas renderer;
 *  - coded slides: the slide component mounted offscreen with every entrance
 *    fast-forwarded to its end, then rasterised by html-to-image.
 */

/** Where in a clip its still is taken, as a fraction of its length — after the text lands. */
const VIDEO_STILL_AT = 0.85;
/** The archetype's planet drifts across the window; catch it here rather than gone. */
const FLOW_BY_STILL_AT = 0.4;
/** Stands in for any image html-to-image can't fetch (e.g. a stamp host without CORS). */
const BLANK_IMAGE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export async function renderSlide(slideId: SlideId, doc: WrappedDoc): Promise<Blob> {
  const scene = SCENES[slideId];
  return scene.kind === "video" ? renderVideoSlide(scene, doc) : renderCodedSlide(slideId, doc);
}

/** How long any one media event may take before the slide is given up on. */
const MEDIA_TIMEOUT_MS = 15000;

function waitFor(target: EventTarget, event: string) {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`timed out waiting for ${event}`)),
      MEDIA_TIMEOUT_MS,
    );
    target.addEventListener(
      event,
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
    target.addEventListener(
      "error",
      () => {
        clearTimeout(timeout);
        reject(new Error(`failed waiting for ${event}`));
      },
      { once: true },
    );
  });
}

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/** A fixed-size host parked offscreen, so layout runs at comp size without being seen. */
function offscreenHost() {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, {
    position: "fixed",
    left: "-20000px",
    top: "0",
    width: `${COMP_WIDTH}px`,
    height: `${COMP_HEIGHT}px`,
    pointerEvents: "none",
  });
  document.body.append(host);
  return host;
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("empty canvas"))),
      "image/png",
    ),
  );
}

async function renderVideoSlide(scene: VideoScene, doc: WrappedDoc): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = COMP_WIDTH;
  canvas.height = COMP_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("no 2d context");

  // Attached (offscreen) and loaded explicitly: some browsers won't fetch or seek a
  // detached video.
  const host = offscreenHost();
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  host.append(video);
  let time = 0;
  try {
    const loaded = waitFor(video, "loadeddata");
    video.src = scene.video;
    video.load();
    await loaded;
    time = video.duration * VIDEO_STILL_AT;
    const seeked = waitFor(video, "seeked");
    video.currentTime = time;
    await seeked;

    // object-cover, as on the stage.
    const scale = Math.max(COMP_WIDTH / video.videoWidth, COMP_HEIGHT / video.videoHeight);
    const width = video.videoWidth * scale;
    const height = video.videoHeight * scale;
    context.drawImage(video, (COMP_WIDTH - width) / 2, (COMP_HEIGHT - height) / 2, width, height);
  } finally {
    video.removeAttribute("src");
    video.load();
    host.remove();
  }

  if (scene.lottie) await drawLottie(context, scene.lottie, scene.texts?.(doc) ?? {}, time);
  return canvasToBlob(canvas);
}

/**
 * Draws the Lottie comp at `time` seconds, retexted, over whatever `context` holds.
 *
 * Uses the SVG renderer, as the deck does, then rasterises it: lottie-web's canvas
 * renderer draws no text without baked glyphs, and trips on some comps' expressions.
 */
async function drawLottie(
  context: CanvasRenderingContext2D,
  src: string,
  texts: Record<string, string>,
  time: number,
) {
  const [data] = await Promise.all([
    fetch(src).then((response) => response.json()),
    document.fonts.load(`${LOTTIE_FONT_WEIGHT} 100px "${LOTTIE_FONT_FAMILY}"`).catch(() => {}),
  ]);

  const host = offscreenHost();
  const animation = lottie.loadAnimation({
    container: host,
    renderer: "svg",
    loop: false,
    autoplay: false,
    animationData: withWebfont(data),
    rendererSettings: { preserveAspectRatio: "xMidYMid slice" },
  });
  try {
    await new Promise<void>((resolve) => animation.addEventListener("DOMLoaded", () => resolve()));
    for (const [layer, text] of Object.entries(texts)) setLayerText(animation, layer, text);
    animation.goToAndStop(time * animation.frameRate, true);
    const svg = host.querySelector("svg");
    if (svg) context.drawImage(await svgToImage(svg), 0, 0, COMP_WIDTH, COMP_HEIGHT);
  } finally {
    animation.destroy();
    host.remove();
  }
}

/** The Lottie font's stylesheet; its faces are inlined into each rasterised comp. */
const LOTTIE_FONT_CSS = `https://fonts.googleapis.com/css2?family=${LOTTIE_FONT_FAMILY.replace(/ /g, "+")}:wght@${LOTTIE_FONT_WEIGHT}&display=swap`;

let fontFaceCss: Promise<string> | null = null;

/**
 * `@font-face` rules for the Lottie font with the files inlined as data URLs. An SVG
 * drawn as an image can't load anything, so without these its text falls back to a
 * system font.
 */
function embeddedFontCss(): Promise<string> {
  fontFaceCss ??= (async () => {
    const css = await (await fetch(LOTTIE_FONT_CSS)).text();
    const urls = [...new Set(css.match(/https:[^)\s]+\.woff2/g) ?? [])];
    let embedded = css;
    for (const url of urls) {
      const blob = await (await fetch(url)).blob();
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(blob);
      });
      embedded = embedded.replaceAll(url, dataUrl);
    }
    return embedded;
  })().catch((error) => {
    fontFaceCss = null;
    console.warn("[wrapped] couldn't embed the Lottie font", error);
    return "";
  });
  return fontFaceCss;
}

/** Rasterises a live `<svg>` at comp size, with the Lottie font embedded. */
async function svgToImage(svg: SVGSVGElement): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(COMP_WIDTH));
  clone.setAttribute("height", String(COMP_HEIGHT));
  clone.removeAttribute("style");
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = await embeddedFontCss();
  clone.prepend(style);

  const url = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" }),
  );
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function renderCodedSlide(slideId: SlideId, doc: WrappedDoc): Promise<Blob> {
  const host = offscreenHost();
  const root = createRoot(host);
  try {
    // Rendered asynchronously, then waited for: callers are often inside an effect, where
    // React won't flush a render synchronously.
    root.render(<CodedSlideContent slideId={slideId} doc={doc} active />);
    let comp: HTMLElement | null = null;
    for (let frame = 0; frame < 60 && !comp; frame++) {
      await nextFrame();
      comp = host.querySelector<HTMLElement>("[data-wrapped-comp]");
    }
    if (!comp) throw new Error(`${slideId} has no comp`);

    await document.fonts.ready;
    await Promise.all(
      Array.from(host.querySelectorAll("img"), (img) => img.decode().catch(() => {})),
    );
    settleAnimations(host);
    await nextFrame();
    await nextFrame();

    // Pinned to the host's corner at full size: the comp normally centres and scales
    // itself, which the capture would otherwise inherit.
    Object.assign(comp.style, { transform: "none", left: "0", top: "0" });

    const blob = await toBlob(comp, {
      width: COMP_WIDTH,
      height: COMP_HEIGHT,
      pixelRatio: 1,
      // The slide's base colour lives on the scaling wrapper, outside the capture.
      backgroundColor: comp.parentElement
        ? getComputedStyle(comp.parentElement).backgroundColor
        : undefined,
      imagePlaceholder: BLANK_IMAGE,
    });
    if (!blob) throw new Error(`${slideId} rendered no image`);
    return blob;
  } finally {
    root.unmount();
    host.remove();
  }
}

/** Jumps every entrance to its end state; looping idles are held at their first frame. */
function settleAnimations(host: HTMLElement) {
  for (const animation of host.getAnimations({ subtree: true })) {
    const timing = animation.effect?.getComputedTiming();
    if (!timing) continue;
    if (animation instanceof CSSAnimation && animation.animationName === "wrapped-flow-by") {
      animation.pause();
      animation.currentTime = (timing.delay ?? 0) + Number(timing.duration) * FLOW_BY_STILL_AT;
    } else if (timing.endTime !== Number.POSITIVE_INFINITY) {
      animation.finish();
    } else {
      animation.pause();
      animation.currentTime = 0;
    }
  }
}

/**
 * Hands the images to the hacker: the system share sheet on phones (where "Save Image"
 * lands them in the camera roll), plain downloads everywhere else.
 */
export async function saveSlideImages(files: File[]): Promise<void> {
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  if (isTouch && navigator.canShare?.({ files })) {
    try {
      await navigator.share({ files });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      // Anything else (e.g. too many files) falls through to downloads.
    }
  }
  for (const file of files) {
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    // Spaced out: browsers drop back-to-back downloads, and revoke too early cancels them.
    await new Promise((resolve) => setTimeout(resolve, 300));
    URL.revokeObjectURL(url);
  }
}
