import { type SummaryData, SummarySlide } from "@/components/features/wrapped/summary-slide";
import { createFileRoute, notFound } from "@tanstack/react-router";
import lottie, { type AnimationItem } from "lottie-web";
import { useEffect, useRef, useState } from "react";

/**
 * Scratch page for eyeballing Wrapped's slides — each mp4, with its Lottie text on top
 * where it has one — played in sequence, closing on the coded summary slide.
 *
 * Not part of the Wrapped product surface — it exists so the animation pair can be
 * checked in a browser at the real 9:16 aspect before either is wired into a slide.
 * Top-level and unauthenticated for the same reason `/wrapped/view/$shareId` is:
 * `$activeHackathon`'s `beforeLoad` would bounce us to `/application`.
 *
 * Try values with `?text=a,b` — they fill the current slide's text layers in order; omit
 * it for the strings baked into each comp. `?slide=n` opens on the nth slide (0-based).
 */

/**
 * One slide of the sequence. `video` is the opaque base; `lottie` is an optional text layer
 * on top — slides without one are the static clips. `textLayers` are the comp's text layer
 * names, in the order `?text=` fills them.
 */
type VideoScene = { video: string; lottie?: string; textLayers?: readonly string[] };

/** The closing recap — coded, not a video, and holds on screen instead of advancing. */
type SummaryScene = { summary: SummaryData };

type Scene = VideoScene | SummaryScene;

const sceneKey = (scene: Scene) => ("video" in scene ? scene.video : "summary");

/** Stand-in numbers until the slide reads the hacker's `WrappedDoc`. */
const PLACEHOLDER_SUMMARY: SummaryData = { hackathon: "HackCamp 2026" };

const SCENES: Record<string, Scene[]> = {
  hackcamp2026: [
    {
      video: "/assets/wrapped/attendance/attendance-bg.mp4",
      lottie: "/assets/wrapped/attendance/attendance.json",
      textLayers: [".preHackathonWorkshops", ".dayOfWorkshops"],
    },
    { video: "/assets/wrapped/early-bird/early-bird-check-in.mp4" },
    {
      video: "/assets/wrapped/early-submission/early-submission-bg.mp4",
      lottie: "/assets/wrapped/early-submission/early-submission.json",
      textLayers: ["You submitted 10 hours early!"],
    },
    { video: "/assets/wrapped/first-timer/first-timer.mp4" },
    { video: "/assets/wrapped/returning-hacker/returning-hacker.mp4" },
    {
      video: "/assets/wrapped/tech-stack/tech-stack-base.mp4",
      lottie: "/assets/wrapped/tech-stack/tech-stack-text-new.json",
      textLayers: ["techStack1", "techStack2", "techStack3", "techStack4"],
    },
    { summary: PLACEHOLDER_SUMMARY },
  ],
};

/** Tapping "back" within this many seconds of a slide's start goes to the previous slide. */
const RESTART_THRESHOLD_S = 1.5;

/**
 * The webfont the comp's text is drawn in. The early-submission comp names "HK Grotesk"
 * ExtraBold, which we don't serve, and has no baked `chars` — so `withWebfont` repoints
 * its font list at Hanken Grotesk 800 (loaded in styles.css) before lottie sees it.
 */
const LOTTIE_FONT_FAMILY = "Hanken Grotesk";
const LOTTIE_FONT_WEIGHT = "800";

type LottieFont = { fFamily: string; fWeight: string; fStyle: string };

/**
 * lottie-web derives CSS weight from `fStyle` words and doesn't know "ExtraBold" (it'd
 * fall to 400), but an explicit `fWeight` wins — so set that and clear the style.
 */
function withWebfont<T extends { fonts?: { list?: LottieFont[] }; chars?: unknown[] }>(data: T): T {
  // Baked glyph outlines are looked up by family name, so repointing would blank them.
  if (data.chars?.length) return data;
  for (const font of data.fonts?.list ?? []) {
    font.fFamily = LOTTIE_FONT_FAMILY;
    font.fWeight = LOTTIE_FONT_WEIGHT;
    font.fStyle = "";
  }
  return data;
}

/**
 * The bits of lottie-web's internals we reach into. `updateDocumentData` is the supported
 * way to retext a layer, but neither it nor `renderer.elements` is in the published types.
 */
type TextElement = { updateDocumentData: (documentData: { t: string }, index: number) => void };
type AnimationInternals = {
  animationData: { layers: { nm: string }[]; chars?: { ch: string }[] };
  renderer: { elements: (TextElement | undefined)[] };
};

/**
 * Retext one layer by its After Effects name.
 *
 * `renderer.elements` is index-parallel to `animationData.layers`, so the layer name is
 * enough to find the element — no key-path plumbing and no editing the JSON. The `0` is
 * the text-document keyframe index; these layers each hold exactly one.
 */
function setLayerText(animation: AnimationItem, layerName: string, text: string) {
  const internals = animation as unknown as AnimationInternals;
  const index = internals.animationData.layers.findIndex((layer) => layer.nm === layerName);
  if (index === -1) {
    console.warn(`[wrapped] no layer named ${layerName}`);
    return;
  }
  internals.renderer.elements[index]?.updateDocumentData({ t: text }, 0);
}

/**
 * The comp ships its font as baked glyph outlines in `chars`, and After Effects only bakes
 * the glyphs the placeholder strings happened to use. Anything outside that set renders as
 * nothing at all, silently — so say so loudly here rather than leaving a gap on the stage.
 */
function warnOnMissingGlyphs(animation: AnimationItem, texts: string[]) {
  const chars = (animation as unknown as AnimationInternals).animationData.chars;
  if (!chars) return;
  const available = new Set(chars.map((char) => char.ch));
  const missing = [...new Set(texts.join(""))].filter((char) => !available.has(char));
  if (missing.length > 0) {
    console.warn(
      `[wrapped] glyphs missing from the comp's baked font: ${missing.join(" ")} — these render blank. Re-export from After Effects with the full character set, or drop \`chars\` and load HK Grotesk as a webfont.`,
    );
  }
}

export const Route = createFileRoute("/wrapped/$eventId")({
  validateSearch: (search: Record<string, unknown>) => ({
    text: typeof search.text === "string" ? search.text : undefined,
    slide: typeof search.slide === "number" ? search.slide : undefined,
  }),
  loader: ({ params }) => {
    const scenes = SCENES[params.eventId];
    if (!scenes) throw notFound();
    return { scenes };
  },
  component: RouteComponent,
});

/**
 * Plays the scenes in sequence, advancing when each video ends. Tap the right half to skip
 * ahead; tap the left half to restart the current slide, and again quickly to go back.
 */
function RouteComponent() {
  const { scenes } = Route.useLoaderData();
  const { text, slide } = Route.useSearch();
  const [index, setIndex] = useState(() => Math.min(Math.max(slide ?? 0, 0), scenes.length - 1));
  const [progress, setProgress] = useState(0);
  const videosRef = useRef<(HTMLVideoElement | null)[]>([]);

  const goTo = (target: number) => {
    setProgress(0);
    setIndex(target);
  };
  const next = () => {
    if (index < scenes.length - 1) goTo(index + 1);
  };
  const back = () => {
    const video = videosRef.current[index];
    if (video && video.currentTime > RESTART_THRESHOLD_S) {
      video.currentTime = 0;
      void video.play();
    } else if (index > 0) {
      goTo(index - 1);
    } else if (video) {
      video.currentTime = 0;
    }
  };

  const handleStageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX - rect.left < rect.width / 2) back();
    else next();
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") next();
      else if (event.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex h-full min-h-screen items-center justify-center bg-black p-4">
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: arrow keys are handled on window */}
      <div
        className="relative aspect-[1080/1920] h-full max-h-[calc(100vh-2rem)] cursor-pointer select-none overflow-hidden rounded-xl bg-black"
        onClick={handleStageClick}
      >
        {/* The previous, current and next slides are mounted, stacked; the neighbours stay
            loaded hidden while this one plays. Keyed by video, so moving either way reuses
            the already-loaded element instead of remounting it. */}
        {scenes.map((scene, i) =>
          Math.abs(i - index) > 1 ? null : "summary" in scene ? (
            <SummaryStage
              key={sceneKey(scene)}
              data={scene.summary}
              active={i === index}
              onProgress={setProgress}
            />
          ) : (
            <SceneStage
              key={sceneKey(scene)}
              scene={scene}
              text={text}
              active={i === index}
              videoRef={(video) => {
                videosRef.current[i] = video;
              }}
              onEnded={next}
              onProgress={setProgress}
            />
          ),
        )}
        <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex gap-1">
          {scenes.map((scene, i) => (
            <div
              key={sceneKey(scene)}
              className="h-1 flex-1 overflow-hidden rounded-full bg-white/30"
            >
              <div
                className="h-full bg-white"
                style={{ width: `${i < index ? 100 : i === index ? progress * 100 : 0}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The summary has no clock to report, so its bar fills once it is on screen. */
function SummaryStage({
  data,
  active,
  onProgress,
}: {
  data: SummaryData;
  active: boolean;
  onProgress: (fraction: number) => void;
}) {
  useEffect(() => {
    if (active) onProgress(1);
  }, [active, onProgress]);

  return (
    <div className={`absolute inset-0 ${active ? "visible" : "invisible"}`}>
      <SummarySlide data={data} active={active} />
    </div>
  );
}

function SceneStage({
  scene,
  text,
  active,
  videoRef,
  onEnded,
  onProgress,
}: {
  scene: VideoScene;
  text: string | undefined;
  active: boolean;
  videoRef: (video: HTMLVideoElement | null) => void;
  onEnded: () => void;
  onProgress: (fraction: number) => void;
}) {
  const ownVideoRef = useRef<HTMLVideoElement>(null);
  const setVideo = (video: HTMLVideoElement | null) => {
    ownVideoRef.current = video;
    videoRef(video);
  };

  // Entering a slide always starts it from the top; leaving parks it back at frame 0 so it's
  // ready to show instantly next time.
  useEffect(() => {
    const video = ownVideoRef.current;
    if (!video) return;
    video.currentTime = 0;
    if (active) void video.play().catch(() => {});
    else video.pause();
  }, [active]);

  const lottieHostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = lottieHostRef.current;
    if (!host || !scene.lottie) return;

    let cancelled = false;
    let teardown = () => {};

    const start = (animationData: object) => {
      if (cancelled) return;

      const animation = lottie.loadAnimation({
        container: host,
        renderer: "svg",
        loop: false,
        autoplay: false,
        animationData,
        rendererSettings: {
          // The comp is 1080x1920 and so is the stage, so the two scale as one unit.
          preserveAspectRatio: "xMidYMid slice",
        },
      });

      // Elements don't exist until the renderer has built them, so retexting has to wait for
      // DOMLoaded. (For the same reason `progressiveLoad` stays off: layers that enter late
      // wouldn't be built yet here under progressive loading.)
      const applyText = () => {
        const texts = text
          ?.split(",")
          .map((value) => value.trim())
          .filter(Boolean);
        const layers = scene.textLayers ?? [];
        if (!texts?.length || !layers.length) return;
        warnOnMissingGlyphs(animation, texts);
        texts.slice(0, layers.length).forEach((value, i) => {
          setLayerText(animation, layers[i], value);
        });
      };
      // The video is the clock. Letting both run on their own `autoplay` made the text run
      // ahead of the still-buffering mp4; driving the Lottie off `currentTime` also absorbs
      // rebuffering and tab-throttling mid-play.
      let frameHandle = 0;
      let ready = false;

      const sync = () => {
        frameHandle = requestAnimationFrame(sync);
        const video = ownVideoRef.current;
        if (!ready || !video) return;
        animation.goToAndStop(video.currentTime * animation.frameRate, true);
      };

      const onLoaded = () => {
        ready = true;
        applyText();
      };
      animation.addEventListener("DOMLoaded", onLoaded);
      frameHandle = requestAnimationFrame(sync);

      teardown = () => {
        cancelAnimationFrame(frameHandle);
        animation.removeEventListener("DOMLoaded", onLoaded);
        animation.destroy();
      };
    };

    // The comp's font has an empty `fPath`, which lottie-web reads as "already loaded" and
    // measures glyphs against whatever the browser has now — so load the webfont first to
    // keep the spacing honest.
    const fontReady = document.fonts
      .load(`${LOTTIE_FONT_WEIGHT} 100px "${LOTTIE_FONT_FAMILY}"`)
      .catch(() => {});
    void Promise.all([fetch(scene.lottie).then((response) => response.json()), fontReady]).then(
      ([data]) => start(withWebfont(data)),
    );

    return () => {
      cancelled = true;
      teardown();
    };
  }, [scene, text]);

  return (
    <div className={`absolute inset-0 ${active ? "visible" : "invisible"}`}>
      <video
        ref={setVideo}
        className="absolute inset-0 h-full w-full object-cover"
        src={scene.video}
        preload="auto"
        muted
        playsInline
        onEnded={active ? onEnded : undefined}
        onTimeUpdate={(event) => {
          const video = event.currentTarget;
          if (active && video.duration) onProgress(video.currentTime / video.duration);
        }}
      />
      <div ref={lottieHostRef} className="pointer-events-none absolute inset-0" />
    </div>
  );
}
