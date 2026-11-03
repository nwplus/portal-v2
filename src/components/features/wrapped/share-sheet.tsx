import { renderShareCard, saveImage } from "@/components/features/wrapped/export-share-card";
import { ROCKET_HEIGHT, ROCKET_WIDTH, RocketShip } from "@/components/features/wrapped/rocket-ship";
import type { WrappedDoc } from "@/lib/firebase/types/wrapped";
import { shareCardFileName } from "@/lib/wrapped/share-card";
import { Download, RotateCcw, X } from "lucide-react";
import { useEffect, useState } from "react";

export type ShareImage =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "ready"; file: File; url: string }
  | { status: "failed" };

/**
 * How long after `start` the first render begins, so it doesn't land on the summary's
 * entrance. Always over before the share button appears (`SUMMARY_SETTLE_MS`).
 */
const START_DELAY_MS = 1200;

/**
 * The share card's image, rendered once and kept for the visit. Rendering starts the
 * first time `start` is true (and stays started), so it runs in the background while the
 * summary plays and is usually done before the share button is tapped.
 *
 * @param start - begin rendering (the summary is up, or the sheet is open)
 */
export function useShareImage(doc: WrappedDoc, start: boolean) {
  const [requested, setRequested] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [image, setImage] = useState<ShareImage>({ status: "idle" });
  if (start && !requested) setRequested(true);

  useEffect(() => {
    if (!requested) return;
    let cancelled = false;
    let url: string | null = null;

    const timer = setTimeout(
      async () => {
        setImage({ status: "pending" });
        try {
          const blob = await renderShareCard(doc);
          if (cancelled) return;
          const file = new File([blob], shareCardFileName(doc.event), { type: "image/png" });
          url = URL.createObjectURL(file);
          setImage({ status: "ready", file, url });
        } catch (error) {
          console.error("[wrapped] failed to render the share card", error);
          if (!cancelled) setImage({ status: "failed" });
        }
      },
      attempt === 0 ? START_DELAY_MS : 0,
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (url) URL.revokeObjectURL(url);
    };
  }, [doc, requested, attempt]);

  return { image, retry: () => setAttempt((count) => count + 1) };
}

/** The loader shows for at least this long, so a fast render doesn't just flash it. */
const MIN_LOADING_MS = 900;

/**
 * The summary's "share your Wrapped" sheet: rises from the bottom of the stage with a
 * preview of the one image that gets saved, and a button to save it.
 *
 * While the image renders, the preview slot plays a loading animation. Clicks stay
 * inside the sheet so they never reach the stage's tap-to-navigate.
 */
export function ShareSheet({
  image,
  onRetry,
  onClose,
  onSave,
}: {
  image: ShareImage;
  onRetry: () => void;
  onClose: () => void;
  /** Fired on each save, before saving (telemetry). */
  onSave: () => void;
}) {
  // Already rendered when the sheet opened: no loader at all.
  const [loaderDone, setLoaderDone] = useState(image.status === "ready");
  useEffect(() => {
    if (loaderDone) return;
    const timer = setTimeout(() => setLoaderDone(true), MIN_LOADING_MS);
    return () => clearTimeout(timer);
  }, [loaderDone]);

  const ready = image.status === "ready" && loaderDone ? image : null;
  const failed = image.status === "failed";

  const handleSave = () => {
    if (!ready) return;
    onSave();
    // Not awaited before anything else: iOS needs the share sheet opened from the tap.
    void saveImage(ready.file).catch((error) =>
      console.error("[wrapped] failed to save the share card", error),
    );
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape closes the sheet via the deck
    <div
      className="absolute inset-0 z-20 flex cursor-default flex-col justify-end"
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
    >
      <div
        className="absolute inset-0 bg-[#000]/50"
        style={{ animation: "wrapped-fade 250ms ease-out both" }}
      />
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: only stops clicks reaching the backdrop */}
      <section
        aria-label="Share your Wrapped"
        className="relative rounded-t-2xl bg-[#2c2543] pb-5 text-[#fff]"
        style={{ animation: "wrapped-sheet-up 350ms cubic-bezier(0.22, 1, 0.36, 1) both" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[#fff]/30" />
        <div className="flex items-center justify-between px-5 pt-3 pb-3">
          <div>
            <h2 className="font-semibold text-lg">Share your Wrapped</h2>
            <p className="text-[#fff]/60 text-sm" aria-live="polite">
              {failed
                ? "Something went wrong making your image."
                : ready
                  ? "Your Hacker Wrapped is ready to post."
                  : "Making your image…"}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-full p-1.5 text-[#fff]/70 hover:text-[#fff]"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex justify-center px-5">
          <div className="relative aspect-[9/16] h-[min(52dvh,560px)] overflow-hidden rounded-xl bg-[#1a1138] shadow-[0_8px_32px_rgb(0_0_0/0.45)]">
            {ready ? (
              // A real image, so press-and-hold can save it where the button can't.
              <img
                alt="Your Hacker Wrapped"
                src={ready.url}
                className="size-full object-cover [-webkit-touch-callout:default] [user-select:auto]"
                style={{ animation: "wrapped-fade 400ms ease-out both" }}
              />
            ) : failed ? (
              <div className="flex size-full flex-col items-center justify-center gap-3 p-4 text-center">
                <p className="text-[#fff]/70 text-sm">We couldn't make your image.</p>
                <button
                  type="button"
                  onClick={() => {
                    setLoaderDone(false);
                    onRetry();
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-[#fff]/40 px-4 py-1.5 font-semibold text-sm hover:bg-[#fff]/10"
                >
                  Try again
                  <RotateCcw className="size-3.5" />
                </button>
              </div>
            ) : (
              <GeneratingPreview />
            )}
          </div>
        </div>

        <div className="px-5 pt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={!ready}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#fff] py-3 font-semibold text-[#2c2543] text-sm transition-opacity disabled:opacity-50"
          >
            Download image
            <Download className="size-4" />
          </button>
          {ready && (
            <p className="pointer-coarse:block hidden pt-2 text-center text-[#fff]/50 text-xs">
              Or press and hold the image to save it.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

const LOADING_LINES = [
  "Counting your lines of code…",
  "Dusting off your stamps…",
  "Fuelling the rocket…",
  "Packing your Wrapped…",
];
const LOADING_LINE_MS = 1600;

/**
 * The preview slot while the image renders: the card's sky with the Wrapped rocket
 * bobbing in it, a light sweeping across, and a line of status copy.
 *
 * Motion is CSS transforms and opacity only — the render holds the main thread in bursts,
 * and compositor animations keep moving through them.
 */
function GeneratingPreview() {
  const [line, setLine] = useState(0);
  useEffect(() => {
    const timer = setInterval(
      () => setLine((current) => (current + 1) % LOADING_LINES.length),
      LOADING_LINE_MS,
    );
    return () => clearInterval(timer);
  }, []);

  const rocketWidth = 96;
  return (
    <div className="wrapped-share-loading relative flex size-full flex-col items-center justify-center gap-5">
      <img
        alt=""
        src="/assets/wrapped/summary/background.png"
        className="absolute inset-0 size-full object-cover opacity-70"
      />
      <img
        alt=""
        src="/assets/wrapped/share/stars.svg"
        className="wrapped-twinkle absolute inset-0 size-full object-contain p-[6%]"
      />
      <div
        className="relative"
        style={{
          width: rocketWidth,
          height: (rocketWidth * ROCKET_HEIGHT) / ROCKET_WIDTH,
          animation: "wrapped-bob 1.4s ease-in-out infinite",
        }}
      >
        <div
          className="origin-top-left"
          style={{ transform: `scale(${rocketWidth / ROCKET_WIDTH})` }}
        >
          <RocketShip />
        </div>
      </div>
      <p
        key={line}
        className="relative px-4 text-center font-semibold text-[#c5fffb] text-sm"
        style={{ animation: "wrapped-fade 400ms ease-out both" }}
      >
        {LOADING_LINES[line]}
      </p>
      {/* A soft band of light sweeping across, like a card being printed. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-[#fff]/12 to-transparent"
        style={{ animation: "wrapped-shimmer 1.8s ease-in-out infinite" }}
      />
    </div>
  );
}
