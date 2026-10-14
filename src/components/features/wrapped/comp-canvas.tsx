import { cn } from "@/lib/utils";
import { type ReactNode, forwardRef, useLayoutEffect, useRef, useState } from "react";

export const COMP_WIDTH = 1080;
export const COMP_HEIGHT = 1920;

/**
 * A fixed 1080x1920 comp, laid out in comp pixels and scaled as one unit to cover its
 * container, centred — the way the video slides' `object-cover` does, so coded slides
 * line up with them when the stage isn't exactly 9:16.
 *
 * The forwarded ref, and `[data-wrapped-comp]`, mark the unscaled comp, which is what a
 * saved slide image captures.
 */
export const CompCanvas = forwardRef<HTMLDivElement, { className?: string; children: ReactNode }>(
  function CompCanvas({ className, children }, ref) {
    const hostRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0);

    useLayoutEffect(() => {
      const host = hostRef.current;
      if (!host) return;
      const observer = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        setScale(Math.max(width / COMP_WIDTH, height / COMP_HEIGHT));
      });
      observer.observe(host);
      return () => observer.disconnect();
    }, []);

    return (
      <div ref={hostRef} className={cn("absolute inset-0 overflow-hidden", className)}>
        <div
          ref={ref}
          data-wrapped-comp
          className="absolute top-1/2 left-1/2 h-[1920px] w-[1080px] overflow-hidden"
          style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    );
  },
);
