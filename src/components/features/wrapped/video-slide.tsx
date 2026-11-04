import { cn } from "@/lib/utils";
import {
  LOTTIE_FONT_FAMILY,
  LOTTIE_FONT_WEIGHT,
  LOTTIE_RENDERER_SETTINGS,
  type LayerText,
  lottieAssetsPath,
  setLayerText,
  withWebfont,
} from "@/lib/wrapped/lottie";
import lottie, { type AnimationItem } from "lottie-web";
import { useEffect, useRef, useState } from "react";

export interface VideoSlideProps {
  /** The opaque base clip. */
  video: string;
  /** Optional After Effects text layer drawn over the clip. */
  lottie?: string;
  /** Text per Lottie layer name. Layers not listed keep the comp's baked text. */
  texts?: Record<string, LayerText>;
  /** Shown and playing. The deck sets it once `onReady` has fired (or its wait runs out). */
  active: boolean;
  /** Called once the clip has frames to show and the text layer is built and retexted. */
  onReady?: () => void;
}

/**
 * One video slide: the mp4, plus its Lottie text retexted with the hacker's numbers.
 *
 * Mounted hidden while a neighbour plays so it is loaded by the time it's shown;
 * `active` starts it from the top, and leaving parks it back at frame 0. The clip plays
 * once and rests on its last frame; the deck's clock, not the clip, sets the pace.
 */
export function VideoSlide({
  video: src,
  lottie: lottieSrc,
  texts,
  active,
  onReady,
}: VideoSlideProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lottieHostRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const [videoReady, setVideoReady] = useState(false);
  const [lottieReady, setLottieReady] = useState(!lottieSrc);

  // Declared before the preload below, so its pause on mount can't cancel that play().
  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;
    element.currentTime = 0;
    if (active) void element.play().catch(() => {});
    else element.pause();
  }, [active]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new `src` is a new clip to load
  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;
    setVideoReady(element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA);
    const markReady = () => setVideoReady(true);
    element.addEventListener("loadeddata", markReady);

    // iOS treats preload="auto" as "metadata", so a paused clip fetches no frames until
    // it's played, and a hidden neighbour would start buffering only once it's on screen.
    // A muted inline clip may play without a tap, so a brief play-and-park loads it the
    // way other browsers already do. If that's refused (Low Power Mode), the deck's wait
    // runs out and the clip loads as it plays.
    if (!activeRef.current) {
      element
        .play()
        .then(() => {
          if (activeRef.current) return;
          element.pause();
          element.currentTime = 0;
        })
        .catch(() => {});
    }

    return () => element.removeEventListener("loadeddata", markReady);
  }, [src]);

  // Keyed on the serialized texts so a parent re-render with an equal object doesn't
  // tear down and rebuild the animation.
  const textsKey = JSON.stringify(texts ?? {});

  useEffect(() => {
    const host = lottieHostRef.current;
    setLottieReady(!lottieSrc);
    if (!host || !lottieSrc) return;
    const layerTexts: Record<string, LayerText> = JSON.parse(textsKey);

    let cancelled = false;
    let teardown = () => {};

    const start = (animationData: { assets?: { p?: unknown; layers?: unknown }[] }) => {
      if (cancelled) return;

      const animation = lottie.loadAnimation({
        container: host,
        renderer: "svg",
        loop: false,
        autoplay: false,
        animationData,
        assetsPath: lottieAssetsPath(lottieSrc),
        rendererSettings: LOTTIE_RENDERER_SETTINGS,
      });

      // The SVG renderer reports DOMLoaded without waiting for image assets, so a comp
      // with images (the early-submission clock) also waits for those.
      const hasImages = (animationData.assets ?? []).some(
        (asset) => typeof asset.p === "string" && !asset.layers,
      );
      let built = false;
      let imagesIn = !hasImages;
      const settle = () => {
        if (built && imagesIn && !cancelled) {
          animationRef.current = animation;
          setLottieReady(true);
        }
      };

      // Elements don't exist until the renderer has built them, so retexting waits for
      // DOMLoaded.
      const onLoaded = () => {
        for (const [layer, text] of Object.entries(layerTexts)) {
          setLayerText(animation, layer, text);
        }
        animation.goToAndStop(0, true);
        built = true;
        settle();
      };
      const onImages = () => {
        imagesIn = true;
        settle();
      };
      animation.addEventListener("DOMLoaded", onLoaded);
      animation.addEventListener("loaded_images", onImages);

      teardown = () => {
        animationRef.current = null;
        animation.removeEventListener("DOMLoaded", onLoaded);
        animation.removeEventListener("loaded_images", onImages);
        animation.destroy();
      };
    };

    // An empty `fPath` reads to lottie-web as "font already loaded", so load the
    // webfont first or glyphs get measured against a fallback.
    const fontReady = document.fonts
      .load(`${LOTTIE_FONT_WEIGHT} 100px "${LOTTIE_FONT_FAMILY}"`)
      .catch(() => {});
    void Promise.all([fetch(lottieSrc).then((response) => response.json()), fontReady])
      .then(([data]) => start(withWebfont(data)))
      .catch((error) => console.error(`[wrapped] failed to load ${lottieSrc}`, error));

    return () => {
      cancelled = true;
      teardown();
    };
  }, [lottieSrc, textsKey]);

  useEffect(() => {
    if (videoReady && lottieReady) onReadyRef.current?.();
  }, [videoReady, lottieReady]);

  // The video is the clock: driving the Lottie off `currentTime` keeps the text in step
  // through buffering, rebuffering and tab throttling. Only the slide on screen runs it;
  // a hidden one rests on frame 0, set when it was built and again here on its first sync.
  useEffect(() => {
    const animation = animationRef.current;
    if (!active || !lottieReady || !animation) return;
    let frameHandle = 0;
    const sync = () => {
      const element = videoRef.current;
      if (element) animation.goToAndStop(element.currentTime * animation.frameRate, true);
    };
    const loop = () => {
      sync();
      frameHandle = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(frameHandle);
  }, [active, lottieReady]);

  return (
    <div className={cn("absolute inset-0", active ? "visible" : "invisible")}>
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src={src}
        preload="auto"
        muted
        playsInline
      />
      <div ref={lottieHostRef} className="pointer-events-none absolute inset-0" />
    </div>
  );
}
