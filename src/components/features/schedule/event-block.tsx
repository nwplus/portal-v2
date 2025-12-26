import { cn } from "@/lib/utils";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

interface EventBlockProps {
  id?: string;
  position: {
    top: number;
    height: number;
    leftPct: number;
    widthPct: number;
  };
  name?: string;
  description?: string;
  startLabel?: string;
  endLabel?: string;
  location?: string;
  points?: string;
}

export function EventBlock({
  id,
  position,
  name,
  description,
  startLabel,
  endLabel,
  location,
  points,
}: EventBlockProps) {
  const cardRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);
  const [animate, setAnimate] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const blockId = useMemo(
    () =>
      id ??
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `event-block-${Math.random().toString(36).slice(2)}`),
    [id],
  );

  const computeTargetFrame = useCallback(() => {
    const maxWidth = Math.min(520, window.innerWidth - 32);
    const maxHeight = Math.min(460, window.innerHeight - 32);
    const left = (window.innerWidth - maxWidth) / 2;
    const top = (window.innerHeight - maxHeight) / 2;
    return { top, left, width: maxWidth, height: maxHeight };
  }, []);

  const [targetFrame, setTargetFrame] = useState(() => computeTargetFrame());

  const closeTimerRef = useRef<number | null>(null);
  const TRANSITION_MS = 250;

  const handleOpen = useCallback(() => {
    if (isFocused) return;
    if (!cardRef.current) return;
    setOriginRect(cardRef.current.getBoundingClientRect());
    setIsFocused(true);
    setAnimate(false);
    window.dispatchEvent(
      new CustomEvent<{ id: string }>("event-block-open", { detail: { id: blockId } }),
    );
  }, [blockId, isFocused]);

  const handleClose = useCallback(() => {
    window.clearTimeout(closeTimerRef.current ?? undefined);
    setAnimate(false);
    closeTimerRef.current = window.setTimeout(() => {
      setIsFocused(false);
    }, TRANSITION_MS);
  }, []);

  useEffect(() => {
    if (!isFocused) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose, isFocused]);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string }>).detail;
      if (detail?.id && detail.id !== blockId && isFocused) {
        setIsFocused(false);
        setAnimate(false);
      }
    };
    window.addEventListener("event-block-open", onOpen);
    return () => window.removeEventListener("event-block-open", onOpen);
  }, [blockId, isFocused]);

  useEffect(() => {
    const handleResize = () => {
      setTargetFrame(computeTargetFrame());
      if (cardRef.current) {
        setOriginRect(cardRef.current.getBoundingClientRect());
      }
      if (contentRef.current) {
        const el = contentRef.current;
        setHasOverflow(el.scrollHeight - el.clientHeight > 1);
      }
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [computeTargetFrame]);

  useLayoutEffect(() => {
    if (!contentRef.current) return;
    const el = contentRef.current;
    setHasOverflow(el.scrollHeight - el.clientHeight > 1);
  }, []);

  // lock scroll while focused
  useEffect(() => {
    if (!isFocused) return;
    const { overflow, touchAction } = document.body.style;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.touchAction = touchAction;
    };
  }, [isFocused]);

  useLayoutEffect(() => {
    if (!isFocused) return;
    const id = window.requestAnimationFrame(() => setAnimate(true));
    return () => window.cancelAnimationFrame(id);
  }, [isFocused]);

  const floatingStyle =
    isFocused && originRect
      ? animate
        ? targetFrame
        : {
            top: originRect.top,
            left: originRect.left,
            width: originRect.width,
            height: originRect.height,
          }
      : null;

  return (
    <>
      <div
        className="absolute py-[0.2vw]"
        style={{
          top: position.top,
          height: position.height,
          left: `${position.leftPct}%`,
          width: `${position.widthPct}%`,
        }}
      >
        <button
          ref={cardRef}
          className={cn("h-full w-full", isFocused ? "pointer-events-none opacity-0" : "")}
          onClick={handleOpen}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleOpen();
            }
          }}
          type="button"
        >
          <div
            ref={contentRef}
            className="grid-1 relative flex h-full w-full cursor-pointer flex-col items-start gap-1 overflow-hidden rounded-xl border border-border-subtle bg-bg-translucent-card px-2.5 py-1.5 backdrop-blur-lg transition-shadow duration-200 hover:shadow-lg"
          >
            <div className="text-left font-semibold text-text-primary">
              {name ?? "Untitled event"}
            </div>
            <div className="flex-grow text-left text-sm text-text-secondary">
              {description ?? ""}
            </div>
            <div>
              <div className="text-sm text-text-secondary">
                {startLabel} — {endLabel}
              </div>
              {(location || points) && (
                <div className="flex gap-3 text-sm text-text-secondary">
                  {location && <div>{location}</div>}
                  {points && <div>{points}</div>}
                </div>
              )}
            </div>

            {hasOverflow && !isFocused && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-line-accent/20 to-transparent" />
            )}
          </div>
        </button>
      </div>

      {isFocused && originRect && floatingStyle && (
        <dialog className="fixed inset-0 z-200 bg-text-accent" open>
          <button
            className={cn(
              "fixed inset-0 bg-bg-main/20 backdrop-blur-sm transition-all duration-300",
              animate ? "opacity-100" : "opacity-0",
            )}
            onClick={handleClose}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleClose();
              }
            }}
            type="button"
            aria-label="Close event details"
          />
          <div
            className="fixed z-50 overflow-hidden rounded-2xl border border-border-subtle bg-bg-translucent-card shadow-xl backdrop-blur-lg transition-all duration-250 ease-out"
            style={{
              top: floatingStyle.top,
              left: floatingStyle.left,
              width: floatingStyle.width,
              height: floatingStyle.height,
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            tabIndex={-1}
          >
            <div
              className={cn(
                "flex h-full w-full flex-col transition-all",
                animate ? "gap-2 p-4" : "gap-1 px-2.5 py-1.5",
              )}
            >
              <div className="flex items-start justify-between">
                <div className="font-semibold text-text-primary">{name ?? "Untitled event"}</div>
              </div>
              <div className="flex-grow text-sm text-text-secondary">{description ?? ""}</div>
              <div className="text-sm text-text-secondary">
                {startLabel} — {endLabel}
              </div>
              {(location || points) && (
                <div className="mt-1 flex gap-3 text-sm text-text-secondary">
                  {location && <div>{location}</div>}
                  {points && <div>{points}</div>}
                </div>
              )}
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
