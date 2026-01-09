import type { StampWithUnlockState } from "@/lib/firebase/types/stamps";
import { cn } from "@/lib/utils";

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
  const imageSrc = stamp.isUnlocked ? stamp.imgURL : "/assets/stampbook/stamp-locked.svg";
  const styles = sizeStyles[size];

  return (
    <div className={cn("flex flex-col items-center", styles.gap)}>
      <div className={cn("relative flex items-center justify-center rounded-full", styles.container)}>
        <img
          src={imageSrc}
          alt={stamp.isUnlocked ? stamp.name : "Locked stamp"}
          className={cn("rounded-full object-cover transition-all duration-300", styles.image)}
        />
      </div>

      {showDetails && (
        // TODO: replace with theme colors
        <div className={cn("flex flex-col items-center gap-0.5 font-mono text-[#0a0a0a]", styles.details)}>
          <span className={cn("text-center font-semibold leading-tight", styles.name)}>{stamp.name}</span>
          <span className={cn("text-center leading-tight", styles.description)}>{stamp.description}</span>
        </div>
      )}
    </div>
  );
}
