import { renderSlide, saveSlideImages } from "@/components/features/wrapped/export-slides";
import type { WrappedDoc } from "@/lib/firebase/types/wrapped";
import { cn } from "@/lib/utils";
import { SLIDE_LABELS, type SlideId } from "@/lib/wrapped/slides";
import { Check, Download, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

type Render =
  | { status: "pending" }
  | { status: "ready"; blob: Blob; url: string }
  | { status: "failed" };

/**
 * The summary's "share your Wrapped" sheet: rises from the bottom of the stage with a
 * horizontal strip of every slide, each a preview of the exact image that will be saved.
 * Tapping a preview toggles it; the Download button under the strip saves the selection
 * as 1080x1920 PNGs.
 *
 * Slides render one at a time as the sheet opens (each mounts a full-size slide or
 * decodes a video frame), and those renders are what gets downloaded. Clicks stay
 * inside the sheet so they never reach the stage's tap-to-navigate.
 */
export function ShareSheet({
  doc,
  slides,
  onClose,
  onSave,
}: {
  doc: WrappedDoc;
  slides: SlideId[];
  onClose: () => void;
  /** Fired on each download, before saving (telemetry). */
  onSave: () => void;
}) {
  const [renders, setRenders] = useState<Partial<Record<SlideId, Render>>>({});
  const [selected, setSelected] = useState<Set<SlideId>>(() => new Set(slides));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];
    const setRender = (slideId: SlideId, render: Render) => {
      if (!cancelled) setRenders((current) => ({ ...current, [slideId]: render }));
    };

    (async () => {
      for (const slideId of slides) {
        if (cancelled) return;
        setRender(slideId, { status: "pending" });
        try {
          const blob = await renderSlide(slideId, doc);
          const url = URL.createObjectURL(blob);
          urls.push(url);
          setRender(slideId, { status: "ready", blob, url });
        } catch (error) {
          console.error(`[wrapped] failed to render ${slideId}`, error);
          setRender(slideId, { status: "failed" });
        }
      }
    })();

    return () => {
      cancelled = true;
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [doc, slides]);

  const toggle = (slideId: SlideId) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(slideId)) next.delete(slideId);
      else next.add(slideId);
      return next;
    });

  // Only finished renders can be saved; one still rendering joins on the next tap.
  const ready = slides.flatMap((slideId, i) => {
    const render = renders[slideId];
    return selected.has(slideId) && render?.status === "ready" ? [{ slideId, i, render }] : [];
  });
  const isPreparing = slides.some((slideId) => {
    const status = renders[slideId]?.status;
    return status === undefined || status === "pending";
  });

  const handleDownload = async () => {
    if (ready.length === 0 || saving) return;
    onSave();
    setSaving(true);
    try {
      await saveSlideImages(
        ready.map(
          ({ slideId, i, render }) =>
            new File(
              [render.blob],
              `${doc.eventId}-wrapped-${String(i + 1).padStart(2, "0")}-${slideId}.png`,
              { type: "image/png" },
            ),
        ),
      );
    } catch (error) {
      console.error("[wrapped] failed to save slides", error);
    } finally {
      setSaving(false);
    }
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
            <p className="text-[#fff]/60 text-sm">
              {isPreparing ? "Preparing previews…" : "Tap the slides you want to save."}
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

        {/* Padded so the selection rings aren't clipped by the scroller's edges. */}
        <div className="flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 py-1.5">
          {slides.map((slideId) => (
            <SlidePreview
              key={slideId}
              label={SLIDE_LABELS[slideId]}
              render={renders[slideId]}
              selected={selected.has(slideId)}
              onToggle={() => toggle(slideId)}
            />
          ))}
        </div>

        <div className="px-5 pt-4">
          <button
            type="button"
            onClick={handleDownload}
            disabled={ready.length === 0 || saving}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#fff] py-3 font-semibold text-[#2c2543] text-sm disabled:opacity-50"
          >
            Download
            {ready.length > 0 && ` ${ready.length} ${ready.length === 1 ? "slide" : "slides"}`}
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          </button>
        </div>
      </section>
    </div>
  );
}

function SlidePreview({
  label,
  render,
  selected,
  onToggle,
}: {
  label: string;
  render: Render | undefined;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex w-24 shrink-0 cursor-pointer snap-start flex-col gap-1.5">
      <input type="checkbox" className="peer sr-only" checked={selected} onChange={onToggle} />
      <span
        className={cn(
          "relative block aspect-[9/16] overflow-hidden rounded-lg bg-[#1a1138] ring-2 transition peer-focus-visible:ring-[#fff]",
          selected ? "ring-[#20ffaf]" : "opacity-50 ring-transparent",
        )}
      >
        {render?.status === "ready" ? (
          <img alt="" src={render.url} className="size-full object-cover" draggable={false} />
        ) : (
          <span className="flex size-full items-center justify-center text-[#fff]/50 text-xs">
            {render?.status === "failed" ? (
              "Unavailable"
            ) : (
              <Loader2 className="size-4 animate-spin" />
            )}
          </span>
        )}
        <span
          className={cn(
            "absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full border",
            selected
              ? "border-[#20ffaf] bg-[#20ffaf] text-[#2c2543]"
              : "border-[#fff]/70 bg-[#000]/30",
          )}
        >
          {selected && <Check className="size-3" strokeWidth={3} />}
        </span>
      </span>
      <span className="truncate text-center text-[#fff]/80 text-xs">{label}</span>
    </label>
  );
}
