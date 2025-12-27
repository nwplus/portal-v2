import { cn } from "@/lib/utils";

/**
 * Background noise created with css filter, mix blend, and svg feTurbulence.
 */
export function NoisyBackground({
  className,
  opacity = 0.2,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed top-0 left-0 z-0 h-full w-full select-none overflow-hidden object-cover",
        className,
      )}
    >
      <svg
        className="h-full w-full mix-blend-normal brightness-50 contrast-200"
        preserveAspectRatio="none"
        viewBox="0 0 1000 1000"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="noooise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="2"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#noooise)" opacity={opacity} />
      </svg>
    </div>
  );
}
