import { cn } from "@/lib/utils";
import { Focus, ZoomIn, ZoomOut } from "lucide-react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./button";

interface ImageViewerProps {
  src: string;
  height?: number | string;
  width?: number | string;
  defaultZoom?: number;
  className?: string;
}

type Point = { x: number; y: number };

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SCALE_STEP = 1;
const TRANSITION_MS = 180;
const MAX_STEPS = Math.round((MAX_SCALE - MIN_SCALE) / SCALE_STEP);

const toCssSize = (value?: number | string) => {
  if (typeof value === "number") return `${value}px`;
  return value;
};

export function ImageViewer({ src, className, height, width, defaultZoom = 1 }: ImageViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const initialScale = useMemo(
    () => Math.min(Math.max(defaultZoom, MIN_SCALE), MAX_SCALE),
    [defaultZoom],
  );

  const [scale, setScale] = useState<number>(initialScale);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [containerHeight, setContainerHeight] = useState<number>();
  const [imageReady, setImageReady] = useState(false);

  const naturalSizeRef = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const dragStartRef = useRef<Point | null>(null);
  const dragOffsetRef = useRef<Point>({ x: 0, y: 0 });
  const pointerCacheRef = useRef<Map<number, Point>>(new Map());
  const pinchStartRef = useRef<{ distance: number; scale: number; anchor: Point } | null>(null);
  const interactionRef = useRef<"none" | "drag" | "pinch">("none");

  const getSizes = useCallback(
    (scaleValue: number) => {
      const containerWidth = containerRef.current?.clientWidth ?? 0;
      const baseWidth = containerWidth;
      const measuredHeight = containerRef.current?.clientHeight ?? 0;
      const baseHeight = containerHeight ?? measuredHeight;

      return {
        containerWidth,
        containerHeight: baseHeight,
        scaledWidth: baseWidth * scaleValue,
        scaledHeight: baseHeight * scaleValue,
      };
    },
    [containerHeight],
  );

  const clampOffset = useCallback(
    (scaleValue: number, nextOffset: Point) => {
      const {
        containerWidth,
        containerHeight: baseHeight,
        scaledWidth,
        scaledHeight,
      } = getSizes(scaleValue);

      if (!containerWidth || !baseHeight) return { x: 0, y: 0 };

      const maxX = Math.max(0, (scaledWidth - containerWidth) / 2);
      const maxY = Math.max(0, (scaledHeight - baseHeight) / 2);

      return {
        x: Math.min(Math.max(nextOffset.x, -maxX), maxX),
        y: Math.min(Math.max(nextOffset.y, -maxY), maxY),
      };
    },
    [getSizes],
  );

  const clampScale = useCallback(
    (value: number) => Math.min(Math.max(value, MIN_SCALE), MAX_SCALE),
    [],
  );

  const snapScale = useCallback((value: number) => {
    const steps = Math.round((value - MIN_SCALE) / SCALE_STEP);
    const clampedSteps = Math.min(Math.max(steps, 0), MAX_STEPS);
    return MIN_SCALE + clampedSteps * SCALE_STEP;
  }, []);

  const updateContainerHeight = useCallback(() => {
    if (height !== undefined) {
      setOffset((current) => clampOffset(scale, current));
      return;
    }

    const containerWidth = containerRef.current?.clientWidth ?? 0;
    const { width: naturalWidth, height: naturalHeight } = naturalSizeRef.current;
    if (!containerWidth || !naturalWidth || !naturalHeight) return;

    const nextHeight = (naturalHeight / naturalWidth) * containerWidth;
    setContainerHeight(nextHeight);
    setOffset((current) => clampOffset(scale, current));
  }, [clampOffset, height, scale]);

  useEffect(() => {
    const handleResize = () => updateContainerHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateContainerHeight]);

  const handleImageLoad = useCallback(() => {
    if (!imageRef.current) return;
    const { naturalWidth, naturalHeight } = imageRef.current;
    naturalSizeRef.current = { width: naturalWidth, height: naturalHeight };
    setImageReady(true);
    updateContainerHeight();
    setScale(initialScale);
    setOffset({ x: 0, y: 0 });
  }, [initialScale, updateContainerHeight]);

  const getAnchorFromClient = useCallback((clientX: number, clientY: number): Point => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: clientX - (rect.left + rect.width / 2),
      y: clientY - (rect.top + rect.height / 2),
    };
  }, []);

  const setScaleWithAnchor = useCallback(
    (nextScale: number, anchor?: Point) => {
      setScale((current) => {
        const clamped = clampScale(nextScale);
        const ratio = clamped / current;
        setOffset((prev) =>
          clampOffset(
            clamped,
            anchor
              ? {
                  x: prev.x - anchor.x * (ratio - 1),
                  y: prev.y - anchor.y * (ratio - 1),
                }
              : prev,
          ),
        );
        return clamped;
      });
    },
    [clampOffset, clampScale],
  );

  const changeScale = useCallback(
    (direction: 1 | -1, anchor?: Point) => {
      const target = snapScale(scale + direction * SCALE_STEP);
      setScaleWithAnchor(target, anchor);
    },
    [scale, setScaleWithAnchor, snapScale],
  );

  const [dragging, setDragging] = useState(false);

  const handleFocus = useCallback(() => {
    setScale(initialScale);
    setOffset({ x: 0, y: 0 });
  }, [initialScale]);

  const handleDoubleClick = useCallback(
    (event: ReactPointerEvent<HTMLImageElement>) => {
      event.preventDefault();
      const anchor = getAnchorFromClient(event.clientX, event.clientY);
      const target = scale >= MAX_SCALE ? initialScale : snapScale(scale + SCALE_STEP);
      setScaleWithAnchor(target, anchor);
    },
    [getAnchorFromClient, initialScale, scale, setScaleWithAnchor, snapScale],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLImageElement>) => {
      if (!imageReady) return;

      pointerCacheRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointerCacheRef.current.size === 2) {
        const points = Array.from(pointerCacheRef.current.values());
        const [p1, p2] = points;
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distance = Math.hypot(dx, dy);
        const anchor = getAnchorFromClient((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
        pinchStartRef.current = { distance, scale, anchor };
        interactionRef.current = "pinch";
      } else {
        dragStartRef.current = { x: event.clientX, y: event.clientY };
        dragOffsetRef.current = offset;
        interactionRef.current = "drag";
      }

      setOffset((prev) => clampOffset(scale, prev));
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
    },
    [clampOffset, getAnchorFromClient, imageReady, offset, scale],
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (event: PointerEvent) => {
      if (interactionRef.current === "pinch") {
        if (!pointerCacheRef.current.has(event.pointerId)) return;
        pointerCacheRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointerCacheRef.current.size < 2) return;

        const points = Array.from(pointerCacheRef.current.values());
        const [p1, p2] = points;
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distance = Math.hypot(dx, dy);
        const start = pinchStartRef.current;

        if (!start) {
          const anchor = getAnchorFromClient((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
          pinchStartRef.current = { distance, scale, anchor };
          return;
        }

        const targetScale = clampScale((distance / start.distance) * start.scale);
        setScale((current) => {
          const ratio = targetScale / current;
          setOffset((prev) =>
            clampOffset(targetScale, {
              x: prev.x - start.anchor.x * (ratio - 1),
              y: prev.y - start.anchor.y * (ratio - 1),
            }),
          );
          return targetScale;
        });
        return;
      }

      if (interactionRef.current === "drag") {
        if (!dragStartRef.current) return;
        const dx = event.clientX - dragStartRef.current.x;
        const dy = event.clientY - dragStartRef.current.y;
        const nextOffset = {
          x: dragOffsetRef.current.x + dx,
          y: dragOffsetRef.current.y + dy,
        };
        setOffset(clampOffset(scale, nextOffset));
      }
    };

    const handleUp = (event: PointerEvent) => {
      pointerCacheRef.current.delete(event.pointerId);

      if (pointerCacheRef.current.size === 1 && interactionRef.current === "pinch") {
        const remaining = Array.from(pointerCacheRef.current.values())[0];
        dragStartRef.current = remaining;
        dragOffsetRef.current = offset;
        interactionRef.current = "drag";
        pinchStartRef.current = null;
        return;
      }

      if (pointerCacheRef.current.size === 0) {
        pinchStartRef.current = null;
        interactionRef.current = "none";
        setDragging(false);
      }
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [clampOffset, clampScale, dragging, getAnchorFromClient, offset, scale]);

  const isZoomed = scale > MIN_SCALE;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex self-end rounded-md bg-bg-button-secondary">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Zoom in"
          onClick={() => changeScale(1)}
          disabled={scale >= MAX_SCALE}
        >
          <ZoomIn />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Zoom out"
          onClick={() => changeScale(-1)}
          disabled={scale <= MIN_SCALE}
        >
          <ZoomOut />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Reset zoom" onClick={handleFocus}>
          <Focus />
        </Button>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-lg bg-bg-pane-container"
        style={{
          // use passed height, otherwise use responsive calculated height
          height:
            height !== undefined
              ? toCssSize(height)
              : containerHeight
                ? `${containerHeight}px`
                : undefined,
          width: toCssSize(width),
        }}
      >
        <img
          ref={imageRef}
          src={src}
          alt=""
          draggable={false}
          onLoad={handleImageLoad}
          onPointerDown={handlePointerDown}
          onDoubleClick={handleDoubleClick}
          className="h-full w-full cursor-grab select-none object-contain active:cursor-grabbing"
          style={{
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
            transformOrigin: "center center",
            touchAction: "none",
            transition: dragging ? "none" : `transform ${TRANSITION_MS}ms ease-out`,
          }}
        />
        {isZoomed ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-lg"
            style={{
              border: "5px solid var(--color-border-accent)",
              opacity: 0.8,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
