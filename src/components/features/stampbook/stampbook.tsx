import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StampWithUnlockState } from "@/lib/firebase/types/stamps";
import { StampbookPage } from "./stampbook-page";
import { organizeIntoSpreads } from "./utils";

interface StampbookProps {
  stamps: StampWithUnlockState[];
  displayName: string;
}

export function Stampbook({ stamps, displayName }: StampbookProps) {
  // Should not display isHidden stamps that are not unlocked
  const stampsToDisplay = stamps.filter((stamp) => !stamp.isHidden || stamp.isUnlocked);

  const [currentSpread, setCurrentSpread] = useState(0);
  const spreads = organizeIntoSpreads(stampsToDisplay);

  const canGoBack = currentSpread > 0;
  const canGoForward = currentSpread < spreads.length - 1;

  const currentSpreadData = spreads[currentSpread];

  return (
    <div className="relative flex items-center justify-center gap-4 py-8">
      {/* TODO: Refactor arrow buttons out */}
      <button
        onClick={() => setCurrentSpread((i) => Math.max(0, i - 1))}
        disabled={!canGoBack}
        className={cn(
          "rounded-full p-2 transition-all",
          canGoBack
            ? "cursor-pointer text-text-primary hover:bg-text-primary/10"
            : "cursor-not-allowed text-text-secondary/30"
        )}
        aria-label="Previous page"
        type="button"
      >
        <ChevronLeft size={40} strokeWidth={1.5} />
      </button>

      <div className="relative flex overflow-hidden rounded-lg shadow-2xl">
        <div className="pointer-events-none absolute inset-0 z-10 rounded-lg bg-gradient-to-b from-black/5 to-black/20" />

        <StampbookPage
          layout={currentSpreadData.isTitleSpread ? "title" : "grid"}
          stamps={currentSpreadData.leftPage}
          title={currentSpreadData.isTitleSpread ? `${displayName}'s stampbook` : undefined}
          className="rounded-l-lg"
        />

        <div className="relative w-3 flex-shrink-0 bg-gradient-to-r from-[#D8D0C4] via-[#C8C0B4] to-[#D8D0C4]">
          <div className="absolute inset-y-0 left-0 w-px bg-[#B8B0A4]" />
          <div className="absolute inset-y-0 right-0 w-px bg-[#B8B0A4]" />
          <div className="-translate-x-1/2 absolute inset-y-0 left-1/2 w-px bg-[#A8A098]" />
        </div>

        <StampbookPage
          layout="grid"
          stamps={currentSpreadData.rightPage}
          className="rounded-r-lg"
        />

        <div className="pointer-events-none absolute right-0 bottom-0 h-10 w-10">
          <div
            className="absolute right-0 bottom-0 h-full w-full"
            style={{
              background: "linear-gradient(135deg, transparent 50%, #E8E0D4 50%, #D8D0C4 100%)",
              borderRadius: "0 0 8px 0",
            }}
          />
        </div>
      </div>

      <button
        onClick={() => setCurrentSpread((i) => Math.min(spreads.length - 1, i + 1))}
        disabled={!canGoForward}
        className={cn(
          "rounded-full p-2 transition-all",
          canGoForward
            ? "cursor-pointer text-text-primary hover:bg-text-primary/10"
            : "cursor-not-allowed text-text-secondary/30"
        )}
        aria-label="Next page"
        type="button"
      >
        <ChevronRight size={40} strokeWidth={1.5} />
      </button>

      {spreads.length > 1 && (
        <div className="-translate-x-1/2 absolute bottom-0 left-1/2 flex gap-2">
          {spreads.map((_, index) => (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: page indicators are positional and don't reorder
              key={`page-indicator-${index}`}
              type="button"
              onClick={() => setCurrentSpread(index)}
              className={cn(
                "h-2 w-2 rounded-full transition-all",
                currentSpread === index
                  ? "bg-text-primary"
                  : "bg-text-secondary/40 hover:bg-text-secondary/60"
              )}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

