import { CodedSlideContent } from "@/components/features/wrapped/coded-slide-content";
import { ShareSheet } from "@/components/features/wrapped/share-sheet";
import { VideoSlide } from "@/components/features/wrapped/video-slide";
import type { WrappedDoc } from "@/lib/firebase/types/wrapped";
import { cn } from "@/lib/utils";
import { dismissWrappedBanner } from "@/lib/wrapped/banner-dismissal";
import { SCENES } from "@/lib/wrapped/scenes";
import { type SlideId, buildSlides } from "@/lib/wrapped/slides";
import { recordWrappedSession } from "@/services/wrapped";
import { Share, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface WrappedDeckProps {
  doc: WrappedDoc;
  /** Firestore collection name for the hackathon; null suppresses telemetry (dev fixtures). */
  dbCollectionName: string | null;
  /** Viewing hacker's uid; null suppresses telemetry. */
  uid: string | null;
  /** Leaves the deck; the close button is hidden without it. */
  onClose?: () => void;
}

/**
 * Every slide's progress bar fills over this long. Clips run longer than their content —
 * the tail is idle — so the bar tracks this, not the clip.
 */
const STORY_MS = 10000;
/** Tapping "back" within this long of a slide's start goes to the previous slide. */
const RESTART_THRESHOLD_MS = 1500;

/**
 * The deck: a 9:16 stage that plays each slide in turn, Stories-style.
 *
 * Which slides exist is `buildSlides(doc)`'s decision and what each plays is `SCENES`'s,
 * so this component never inspects the doc's fields to decide either.
 *
 * Each slide's bar fills over `STORY_MS`, then the slide holds: nothing advances on its
 * own. Tap the right half to skip ahead; the left half restarts the slide, and again
 * quickly to go back. Arrow keys do the same.
 *
 * Telemetry: `opened` on mount, `completed` on reaching the summary, `shareClicked` on
 * saving slides from the share sheet. Each is written at most once per visit.
 */
export function WrappedDeck({ doc, dbCollectionName, uid, onClose }: WrappedDeckProps) {
  const slides = useMemo(() => buildSlides(doc), [doc]);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  // Bumped to replay the current slide from the top (remounting it).
  const [replay, setReplay] = useState(0);
  const startedAtRef = useRef(0);
  const [isSharing, setIsSharing] = useState(false);

  // Clamped rather than read raw: the route can hand down a different doc without
  // remounting (changing `?mock=` re-runs the loader), and a held index can outrun it.
  const safeIndex = Math.min(index, slides.length - 1);
  const current = slides[safeIndex];

  const reportedOpen = useRef(false);
  const reportedComplete = useRef(false);
  const reportedShare = useRef(false);

  const report = useCallback(
    (patch: Parameters<typeof recordWrappedSession>[2]) => {
      if (!dbCollectionName || !uid) return;
      void recordWrappedSession(dbCollectionName, uid, patch);
    },
    [dbCollectionName, uid],
  );

  // Opening the deck is itself a reason to retire the banner, alongside its X button.
  useEffect(() => {
    if (reportedOpen.current) return;
    reportedOpen.current = true;
    report({ opened: true });
    if (dbCollectionName) dismissWrappedBanner(dbCollectionName);
  }, [report, dbCollectionName]);

  // "Completed" means the summary was reached. Fired on arrival rather than on unmount,
  // where a closing tab would lose it.
  useEffect(() => {
    if (reportedComplete.current || current !== "summary") return;
    reportedComplete.current = true;
    report({ completed: true });
  }, [current, report]);

  // The story clock: restarts on every slide change or replay, and stops when full.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `replay` only restarts the clock
  useEffect(() => {
    const startedAt = performance.now();
    startedAtRef.current = startedAt;
    let frame = 0;
    const tick = () => {
      const fraction = Math.min((performance.now() - startedAt) / STORY_MS, 1);
      setProgress(fraction);
      if (fraction < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [safeIndex, replay]);

  const goTo = useCallback(
    (target: number) => {
      setProgress(0);
      setIndex(Math.min(Math.max(target, 0), slides.length - 1));
    },
    [slides.length],
  );

  const next = useCallback(() => {
    if (safeIndex < slides.length - 1) goTo(safeIndex + 1);
  }, [safeIndex, slides.length, goTo]);

  const back = useCallback(() => {
    if (performance.now() - startedAtRef.current > RESTART_THRESHOLD_MS) {
      setReplay((count) => count + 1);
    } else {
      goTo(safeIndex - 1);
    }
  }, [safeIndex, goTo]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      // The share sheet is modal: Escape closes it, and nothing moves the deck behind it.
      if (isSharing) {
        if (event.key === "Escape") setIsSharing(false);
        return;
      }
      if (event.key === "ArrowRight") next();
      else if (event.key === "ArrowLeft") back();
      else if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [next, back, onClose, isSharing]);

  const handleStageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX - rect.left < rect.width / 2) back();
    else next();
  };

  return (
    <div className="flex h-dvh items-center justify-center bg-[#000] md:p-4">
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: arrow keys are handled on window */}
      <div
        className="relative aspect-[1080/1920] h-full max-h-dvh max-w-full cursor-pointer select-none overflow-hidden bg-[#000] md:max-h-[calc(100dvh-2rem)] md:rounded-xl"
        onClick={handleStageClick}
      >
        {/* The current slide and its neighbours stay mounted, so moving either way shows
            an already-buffered slide instead of a blank one. */}
        {slides.map((slideId, i) =>
          Math.abs(i - safeIndex) > 1 ? null : (
            <Slide
              // A replay remounts only the current slide, restarting its clip and entrances.
              key={i === safeIndex ? `${slideId}-${replay}` : slideId}
              slideId={slideId}
              doc={doc}
              active={i === safeIndex}
              onShare={() => setIsSharing(true)}
            />
          ),
        )}

        {/* Stories-style progress: one segment per slide, the current one filling as it
            plays, over a scrim so the bars read on bright frames too. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-[#000]/45 to-transparent" />
        <div className="pointer-events-none absolute inset-x-2 top-2 z-10 flex gap-[3px]">
          {slides.map((slideId, i) => (
            <div key={slideId} className="h-[3px] flex-1 overflow-hidden rounded-full bg-[#fff]/35">
              <div
                className="h-full origin-left rounded-full bg-[#fff]"
                style={{
                  transform: `scaleX(${i < safeIndex ? 1 : i === safeIndex ? progress : 0})`,
                }}
              />
            </div>
          ))}
        </div>

        {onClose && (
          <button
            type="button"
            aria-label="Close Hacker Wrapped"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            className="absolute top-4 right-2 z-10 rounded-full p-1.5 text-[#fff]/90 drop-shadow hover:text-[#fff]"
          >
            <X className="size-5" />
          </button>
        )}

        {isSharing && (
          <ShareSheet
            doc={doc}
            slides={slides}
            onClose={() => setIsSharing(false)}
            onSave={() => {
              if (reportedShare.current) return;
              reportedShare.current = true;
              report({ shareClicked: true });
            }}
          />
        )}
      </div>
    </div>
  );
}

interface SlideProps {
  slideId: SlideId;
  doc: WrappedDoc;
  active: boolean;
  /** Opens the share sheet, from the summary's share button. */
  onShare: () => void;
}

function Slide({ slideId, doc, active, onShare }: SlideProps) {
  const scene = SCENES[slideId];
  if (scene.kind === "video") {
    return (
      <VideoSlide
        video={scene.video}
        lottie={scene.lottie}
        texts={scene.texts?.(doc)}
        active={active}
      />
    );
  }
  return (
    <div className={cn("absolute inset-0", active ? "visible" : "invisible")}>
      <CodedSlideContent
        slideId={slideId}
        doc={doc}
        active={active}
        summaryAction={<ShareButton onClick={onShare} />}
      />
    </div>
  );
}

/** Laid out in comp pixels: it sits inside the summary comp, under the sign-off. */
function ShareButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="flex items-center gap-[20px] rounded-full bg-[#fff] px-[56px] py-[24px] font-bold text-[#2c2543] text-[40px] transition-transform hover:scale-[1.03]"
    >
      Share your Wrapped
      <Share className="size-[40px]" strokeWidth={2.5} />
    </button>
  );
}
