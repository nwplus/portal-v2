import { cn } from "@/lib/utils";
import {
  LOTTIE_FONT_FAMILY,
  LOTTIE_FONT_WEIGHT,
  setLayerText,
  withWebfont,
} from "@/lib/wrapped/lottie";
import lottie from "lottie-web";
import { useEffect, useRef } from "react";

export interface VideoSlideProps {
  /** The opaque base clip. */
  video: string;
  /** Optional After Effects text layer drawn over the clip. */
  lottie?: string;
  /** Text per Lottie layer name. Layers not listed keep the comp's baked text. */
  texts?: Record<string, string>;
  active: boolean;
}

/**
 * One video slide: the mp4, plus its Lottie text retexted with the hacker's numbers.
 *
 * Mounted hidden while a neighbour plays so it is buffered by the time it's shown;
 * `active` starts it from the top, and leaving parks it back at frame 0. The clip plays
 * once and rests on its last frame; the deck's clock, not the clip, sets the pace.
 */
export function VideoSlide({ video: src, lottie: lottieSrc, texts, active }: VideoSlideProps) {
  const ownVideoRef = useRef<HTMLVideoElement>(null);
  const lottieHostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ownVideoRef.current;
    if (!element) return;
    element.currentTime = 0;
    if (active) void element.play().catch(() => {});
    else element.pause();
  }, [active]);

  // Keyed on the serialized texts so a parent re-render with an equal object doesn't
  // tear down and rebuild the animation.
  const textsKey = JSON.stringify(texts ?? {});

  useEffect(() => {
    const host = lottieHostRef.current;
    if (!host || !lottieSrc) return;
    const layerTexts: Record<string, string> = JSON.parse(textsKey);

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
        rendererSettings: { preserveAspectRatio: "xMidYMid slice" },
      });

      // The video is the clock: driving the Lottie off `currentTime` keeps the text
      // in step through buffering, rebuffering and tab throttling.
      let frameHandle = 0;
      let ready = false;
      const sync = () => {
        frameHandle = requestAnimationFrame(sync);
        const element = ownVideoRef.current;
        if (!ready || !element) return;
        animation.goToAndStop(element.currentTime * animation.frameRate, true);
      };

      // Elements don't exist until the renderer has built them, so retexting waits for
      // DOMLoaded.
      const onLoaded = () => {
        ready = true;
        for (const [layer, text] of Object.entries(layerTexts)) {
          setLayerText(animation, layer, text);
        }
      };
      animation.addEventListener("DOMLoaded", onLoaded);
      frameHandle = requestAnimationFrame(sync);

      teardown = () => {
        cancelAnimationFrame(frameHandle);
        animation.removeEventListener("DOMLoaded", onLoaded);
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

  return (
    <div className={cn("absolute inset-0", active ? "visible" : "invisible")}>
      <video
        ref={ownVideoRef}
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
