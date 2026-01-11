import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { DayOfEvent } from "@/lib/firebase/types";
import { cn, getEventName } from "@/lib/utils";
import { Map as MapIcon, Pointer, Puzzle, Wrench } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

interface EventBlockProps {
  id?: string;
  position: {
    top: number;
    height: number;
    leftPct: number;
    widthPct: number;
  };
  startLabel: string;
  endLabel: string;
  event: DayOfEvent;
}

export function EventBlock({ id, position, startLabel, endLabel, event }: EventBlockProps) {
  const TRANSITION_MS = 250;
  const FOCUSED_MAX_WIDTH_PX = 520;
  const FOCUSED_MAX_HEIGHT_PX = 460;

  const { name, description, location, points, isDelayed, type } = event;

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
    const maxWidth = Math.min(FOCUSED_MAX_WIDTH_PX, window.innerWidth - 32);
    const maxHeight = Math.min(FOCUSED_MAX_HEIGHT_PX, window.innerHeight - 32);
    const left = (window.innerWidth - maxWidth) / 2;
    const top = (window.innerHeight - maxHeight) / 2;
    return { top, left, width: maxWidth, height: maxHeight };
  }, []);

  const [targetFrame, setTargetFrame] = useState(() => computeTargetFrame());

  const closeTimerRef = useRef<number | null>(null);

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

  const eventContent = () => (
    <>
      <div className="flex w-full flex-col items-start justify-between gap-2 md:flex-row md:items-center">
        <div className="order-2 font-semibold text-text-primary md:order-1">
          {name ?? "Untitled event"}
        </div>
        {isDelayed && (
          <Badge variant="destructive" className="-ml-0.5 order-1 md:order-2 md:ml-0 ">
            Delayed
          </Badge>
        )}
      </div>
      <div className="flex-grow text-sm text-text-secondary">{description ?? ""}</div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-text-primary text-xs md:text-sm">
        <div>
          {startLabel} - {endLabel}
        </div>
        {location && (
          <div className="flex items-center gap-1">
            {location} <MapIcon className="h-4 w-4" />
          </div>
        )}
        {points && <div>{points} points</div>}
        {type && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-default">
                {type === "workshops" ? (
                  <Wrench className="h-4 w-4 text-[#059669]" />
                ) : type === "minievents" ? (
                  <Puzzle className="h-4 w-4 text-[#D97706]" />
                ) : null}
              </span>
            </TooltipTrigger>
            <TooltipContent className="z-100">{getEventName(type)}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </>
  );

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
          type="button"
          ref={cardRef}
          className={cn(
            "h-full w-full text-left",
            isFocused ? "pointer-events-none opacity-0" : "",
          )}
          onClick={handleOpen}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleOpen();
            }
          }}
        >
          <div
            ref={contentRef}
            className="grid-1 relative flex h-full w-full cursor-pointer flex-col items-start gap-1 overflow-hidden rounded-xl border border-border-subtle px-3 py-2.5 backdrop-blur-lg transition-shadow duration-200 [background:var(--background-translucent-card)] hover:shadow-xl"
          >
            {eventContent()}
            {hasOverflow && !isFocused && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-bg-main/80 to-transparent">
                <div className="flex h-full items-end justify-center gap-2 pb-2 text-text-neutral/90 text-xs">
                  <div className="flex gap-2">
                    <Pointer className="h-3 w-3" />
                    <div>Expand</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </button>
      </div>

      {isFocused && originRect && floatingStyle && (
        <dialog className="fixed inset-0 z-[99] bg-text-accent" open>
          {/* Background overlay */}
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

          {/* Focused card */}
          <div
            className="fixed z-50 overflow-hidden rounded-2xl border border-border-subtle shadow-xl backdrop-blur-lg transition-all duration-250 ease-out [background:var(--background-translucent-card)]"
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
                animate ? "gap-2 p-4" : "gap-1 px-3 py-2.5",
              )}
            >
              {eventContent()}
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
