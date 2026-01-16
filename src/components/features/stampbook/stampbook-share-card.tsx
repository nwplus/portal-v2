import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import type { StampWithUnlockState } from "@/lib/firebase/types/stamps";
import { useHackerStore } from "@/lib/stores/hacker-store";
import { cn, getColouredHackathonIcon } from "@/lib/utils";
import { forwardRef } from "react";

interface StampbookShareCardProps {
  stamps: StampWithUnlockState[];
  displayName: string;
}

/**
 * A static, shareable card that displays the user's stamp collection.
 * Designed for social media sharing (1:1 aspect ratio).
 */
export const StampbookShareCard = forwardRef<HTMLDivElement, StampbookShareCardProps>(
  ({ stamps }, ref) => {
    const displayName = useHackerStore((state) => state.hacker?.basicInfo?.legalFirstName);
    const { displayNameFull, displayNameShort } = useHackathonInfo();
    const hackathonName = displayNameFull;
    const hackathonDomain = displayNameShort.toLowerCase();
    const HackathonIcon = getColouredHackathonIcon(hackathonDomain);

    const unlockedStamps = stamps.filter((s) => s.isUnlocked);
    const totalStamps = stamps.length;

    const displayStamps = unlockedStamps.slice(0, 9);
    const remainingCount = unlockedStamps.length - displayStamps.length;

    return (
      <div
        ref={ref}
        className="relative flex h-[600px] w-[600px] flex-col overflow-hidden bg-bg-main bg-radial-gradient-bottom-middle font-sans"
      >
        <div className="relative z-10 flex flex-1 flex-col p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-0.5 flex-1 rounded-full bg-border-subtle opacity-60" />
            <div className="flex h-6 w-8 shrink-0 items-center justify-center">
              <HackathonIcon />
            </div>
            <div className="h-0.5 flex-1 rounded-full bg-border-subtle opacity-60" />
          </div>

          <div className="mb-6 flex flex-col items-center gap-4">
            <h1 className="text-center font-semibold text-4xl text-text-primary">
              {displayName}'s Stamps
            </h1>
            <span className="font-mono text-lg text-text-secondary">
              {unlockedStamps.length} of {totalStamps} collected
            </span>
          </div>

          <div className="flex flex-1 items-center justify-center rounded-2xl border border-border-subtle bg-bg-translucent-card p-6 backdrop-blur-md">
            {displayStamps.length === 0 ? (
              <p className="text-text-secondary">No stamps unlocked yet!</p>
            ) : (
              <div
                className={cn(
                  "grid gap-6",
                  displayStamps.length <= 4 ? "grid-cols-2" : "grid-cols-3",
                )}
              >
                {displayStamps.map((stamp) => (
                  <div key={stamp._id} className="flex flex-col items-center gap-2">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-line-accent/50 bg-bg-pane-container shadow-lg">
                      <img
                        src={stamp.imgURL}
                        alt={stamp.name}
                        className="h-20 w-20 rounded-full object-cover"
                        crossOrigin="anonymous"
                      />
                    </div>
                    <span className="max-w-30 text-center font-medium text-text-primary text-xs leading-tight">
                      {stamp.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {remainingCount > 0 && (
            <p className="mt-4 text-center text-sm text-text-secondary">
              +{remainingCount} more stamp{remainingCount > 1 ? "s" : ""}
            </p>
          )}

          <div className="mt-6 flex items-center justify-center gap-3 border-border-subtle border-t pt-4">
            <span className="font-medium text-sm text-text-primary">{hackathonName}</span>
            <span className="text-text-primary">•</span>
            <span className="text-sm text-text-primary">{hackathonDomain}.io</span>
          </div>
        </div>
      </div>
    );
  },
);

StampbookShareCard.displayName = "StampbookShareCard";
