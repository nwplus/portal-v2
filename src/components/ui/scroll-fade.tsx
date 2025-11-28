import { cn } from "@/lib/utils";
import { type ReactNode, useEffect, useRef, useState } from "react";

interface ScrollFadeProps {
  children: ReactNode;
  className?: string;
}

export function ScrollFade({ children, className }: ScrollFadeProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showBottomFade, setShowBottomFade] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let frameId: number | null = null;

    const updateFade = () => {
      frameId = null;

      const { scrollHeight, scrollTop, clientHeight } = el;
      const hasOverflow = scrollHeight > clientHeight;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 1;

      const next = hasOverflow && !isAtBottom;
      setShowBottomFade((prev) => (prev !== next ? next : prev));
    };

    const scheduleUpdate = () => {
      if (frameId != null) return;
      frameId = window.requestAnimationFrame(updateFade);
    };

    // Initial check
    scheduleUpdate();

    el.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(el);

    return () => {
      if (frameId != null) {
        cancelAnimationFrame(frameId);
      }
      el.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={scrollRef}
      className={cn("scrollbar-hidden overflow-y-auto", className)}
      style={{
        maskImage: showBottomFade
          ? "linear-gradient(to bottom, black 90%, transparent 100%)"
          : "none",
        WebkitMaskImage: showBottomFade
          ? "linear-gradient(to bottom, black 90%, transparent 100%)"
          : "none",
      }}
    >
      {children}
    </div>
  );
}
