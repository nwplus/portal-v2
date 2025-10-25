import { cn } from "@/lib/utils";

/**
 * Background noise created with css filter, mix blend, and svg feTurbulence.
 * Parent should have a `relative` property for this component to fill up.
 */
export function NoisyBackground({
  className,
  opacity = 0.5,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <div
      className={cn(
        "absolute top-0 left-0 z-0 h-full w-full select-none overflow-hidden bg-background object-cover",
        className,
      )}
    >
      {/* biome-ignore lint/a11y/noSvgWithoutTitle: to hide browser tooltip */}
      <svg
        className="h-full w-full mix-blend-color-burn contrast-200"
        preserveAspectRatio="none"
        viewBox="0 0 1000 1000"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="noooise">
          <feTurbulence type="fractalNoise" baseFrequency="5" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noooise)" opacity={opacity} />
      </svg>
    </div>
  );
}
