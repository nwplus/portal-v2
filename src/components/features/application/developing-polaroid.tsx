import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface DevelopingPolaroidProps {
  src: string;
  rotation?: number;
  delay?: number;
  duration?: number;
  trigger?: boolean;
  developed?: boolean;
  falling?: boolean;
  className?: string;
}

const FALL_DURATION = 1000;
const REVEAL_DURATION = 4000;

// Displays a polaroid image with a developing effect animation.
export function DevelopingPolaroid({
  src,
  rotation = 0,
  delay = 0,
  trigger = true,
  developed = false,
  falling = false,
  className,
}: DevelopingPolaroidProps) {
  const [shouldAnimate, setShouldAnimate] = useState(developed);
  const [shimmerStarted, setShimmerStarted] = useState(developed);
  const [hasFallen, setHasFallen] = useState(!falling || developed);

  useEffect(() => {
    if (developed) {
      setShouldAnimate(true);
      setShimmerStarted(true);
      setHasFallen(true);
    } else if (!trigger) {
      setShouldAnimate(false);
      setShimmerStarted(false);
      setHasFallen(!falling);
    }
  }, [trigger, developed, falling]);

  useEffect(() => {
    if (!falling || developed) return;

    const fallTimer = setTimeout(() => {
      setHasFallen(true);
    }, 50);

    return () => clearTimeout(fallTimer);
  }, [falling, developed]);

  useEffect(() => {
    if (developed || !trigger) return;

    const baseDelay = falling ? delay + FALL_DURATION : delay;

    const shimmerTimer = setTimeout(() => setShimmerStarted(true), baseDelay);
    const revealTimer = setTimeout(() => setShouldAnimate(true), baseDelay + 2000);

    return () => {
      clearTimeout(shimmerTimer);
      clearTimeout(revealTimer);
    };
  }, [trigger, delay, developed, falling]);

  return (
    <div
      className={cn("relative", className)}
      style={{
        perspective: falling ? "1000px" : undefined,
        perspectiveOrigin: "center center",
      }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          transform: hasFallen
            ? rotation
              ? `rotate(${rotation}deg)`
              : undefined
            : `translateZ(500px) scale(1.5) rotate(${rotation - 8}deg)`,
          opacity: hasFallen ? 1 : 0,
          transition:
            falling && !developed
              ? `transform ${FALL_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${FALL_DURATION * 0.3}ms ease-out`
              : undefined,
          transformStyle: "preserve-3d",
        }}
      >
        <img
          src={src}
          alt=""
          className="block h-auto w-full"
          style={{
            filter: shouldAnimate ? "brightness(1) saturate(1)" : "brightness(0.2) saturate(0.3)",
            transition: `filter ${REVEAL_DURATION}ms ease-in`,
          }}
        />

        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background: "rgba(0, 0, 0, 0.9)",
            opacity: shouldAnimate ? 0 : 1,
            transition: `opacity ${REVEAL_DURATION}ms ease-in`,
          }}
        />

        <div
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            background:
              "linear-gradient(160deg, transparent 0%, transparent 37%, rgba(255, 255, 255, 0.05) 39%, rgba(255, 255, 255, 0.08) 42%, rgba(255, 255, 255, 0.05) 45%, transparent 47%, transparent 51%, rgba(255, 255, 255, 0.05) 53%, rgba(255, 255, 255, 0.08) 56%, rgba(255, 255, 255, 0.1) 60%, rgba(255, 255, 255, 0.08) 64%, rgba(255, 255, 255, 0.05) 67%, transparent 69%, transparent 100%)",
            transform: shimmerStarted ? "translateY(100%)" : "translateY(-85%)",
            transition: shimmerStarted
              ? `transform ${REVEAL_DURATION * 1.5}ms ease-in-out`
              : "none",
          }}
        />
      </div>
    </div>
  );
}
