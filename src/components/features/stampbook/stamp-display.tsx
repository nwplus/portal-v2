import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { StampWithUnlockState } from "@/lib/firebase/types/stamps";
import { cn } from "@/lib/utils";
import { PartyPopperIcon, QrCodeIcon } from "lucide-react";

type StampSize = "sm" | "md";

interface StampDisplayProps {
  stamp: StampWithUnlockState;
  showDetails?: boolean;
  size?: StampSize;
}

const sizeStyles = {
  sm: {
    container: "h-24 w-24",
    image: "h-24 w-24",
    // allows for max 3 lines of description text on mobile
    details: "min-h-20 max-w-24",
    name: "text-xs",
    description: "text-[10px]",
    gap: "gap-1",
  },
  md: {
    container: "h-40 w-40",
    image: "h-40 w-40",
    details: "min-h-16 max-w-40",
    name: "text-base",
    description: "text-xs",
    gap: "gap-2",
  },
} as const;

export function StampDisplay({ stamp, showDetails = true, size = "md" }: StampDisplayProps) {
  const imageSrc = stamp.isUnlocked
    ? stamp.imgURL
    : (stamp.lockedImgURL ?? "/assets/stampbook/stamp-locked.svg");
  const styles = sizeStyles[size];

  return (
    <div className={cn("flex flex-col items-center", styles.gap)}>
      <div
        className={cn("relative flex items-center justify-center rounded-full", styles.container)}
      >
        <img
          src={imageSrc}
          alt={stamp.isUnlocked ? stamp.name : "Locked stamp"}
          className={cn("rounded-full object-cover transition-all duration-300", styles.image)}
        />
      </div>

      {showDetails && (
        // TODO: portal is dark-themed; if dark text is re-used, add as a stylesheet token for reskin
        <div
          className={cn(
            "flex flex-col items-center gap-0.5 font-mono text-[#0a0a0a]",
            styles.details,
          )}
        >
          <span className={cn("text-center font-semibold leading-tight", styles.name)}>
            {stamp.name}
            {stamp.isQRUnlockable && (
              <Tooltip>
                <TooltipTrigger className="ml-2 inline-block align-middle">
                  <QrCodeIcon className="h-4 w-4 text-text-secondary" />
                </TooltipTrigger>
                <TooltipContent>This stamp can be unlocked by scanning a QR code</TooltipContent>
              </Tooltip>
            )}
            {stamp.isEventUnlockable && (
              <Tooltip>
                <TooltipTrigger className="ml-2 inline-block align-middle">
                  <PartyPopperIcon className="h-4 w-4 text-text-secondary" />
                </TooltipTrigger>
                <TooltipContent>
                  Get an organizer to scan your QR after completing this activity!
                </TooltipContent>
              </Tooltip>
            )}
          </span>

          <span className={cn("text-center leading-tight", styles.description)}>
            {stamp.description}
          </span>
        </div>
      )}
    </div>
  );
}
