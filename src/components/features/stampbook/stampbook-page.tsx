import type { StampWithUnlockState } from "@/lib/firebase/types/stamps";
import { cn } from "@/lib/utils";
import { StampDisplay } from "./stamp-display";

type PageLayout = "single" | "grid" | "title";

interface StampbookPageProps {
  layout: PageLayout;
  stamps?: StampWithUnlockState[];
  title?: string;
  className?: string;
  width?: number;
  height?: number;
}

const DEFAULT_WIDTH = 480;
const DEFAULT_HEIGHT = 600;
const MOBILE_THRESHOLD_WIDTH = 400;

export function StampbookPage({
  layout,
  stamps = [],
  title,
  className,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
}: StampbookPageProps) {
  const titleIndex = Math.max(
    0,
    stamps.findIndex((stamp) => stamp.isTitle),
  );
  const isMobile = width < MOBILE_THRESHOLD_WIDTH;

  return (
    // TODO: only used in stampbook for now; add as stylesheet token if re-used
    <div
      className={cn(
        "relative flex flex-col border-[0.5px] border-border-stampbook bg-[#F3EBEA]",
        isMobile ? "p-4" : "p-6",
        className,
      )}
      style={{ width, height }}
    >
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center">
        {layout === "title" && title && (
          <div
            className={cn(
              "flex h-full flex-col items-center justify-center",
              isMobile ? "gap-4" : "gap-8",
            )}
          >
            <div
              className={cn(
                "break-words text-center font-bold font-mono text-[#8A8A8A] tracking-wide",
                isMobile ? "text-base" : "text-xl",
              )}
            >
              {title}
            </div>

            {stamps[titleIndex] && (
              <div
                className={cn(
                  "flex w-full max-w-48 flex-col items-center",
                  isMobile ? "gap-2" : "gap-4",
                )}
              >
                <StampDisplay stamp={stamps[titleIndex]} size={isMobile ? "sm" : "md"} />
              </div>
            )}
          </div>
        )}

        {layout === "single" && stamps[0] && (
          <div className="flex h-full items-center justify-center">
            <StampDisplay stamp={stamps[0]} size={isMobile ? "sm" : "md"} />
          </div>
        )}

        {layout === "grid" && (
          <div
            className={cn(
              "grid h-full w-full grid-cols-2 grid-rows-2 items-start",
              isMobile ? "gap-x-4 gap-y-3" : "gap-x-6 gap-y-6",
            )}
          >
            {stamps.slice(0, 4).map((stamp) => (
              <StampDisplay key={stamp._id} stamp={stamp} size={isMobile ? "sm" : "md"} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
