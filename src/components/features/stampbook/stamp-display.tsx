import type { StampWithUnlockState } from "@/lib/firebase/types/stamps";

interface StampDisplayProps {
  stamp: StampWithUnlockState;
  showDetails?: boolean;
}

export function StampDisplay({ stamp, showDetails = true }: StampDisplayProps) {
  const imageSrc = stamp.isUnlocked ? stamp.imgURL : "/assets/stampbook/stamp-locked.svg";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex h-40 w-40 items-center justify-center rounded-full">
        <img
          src={imageSrc}
          alt={stamp.isUnlocked ? stamp.name : "Locked stamp"}
          className="h-40 w-40 rounded-full object-cover transition-all duration-300"
        />
      </div>

      {showDetails && (
        // TODO: replace with theme colors
        <div className="flex min-h-14 max-w-40 flex-col items-center gap-0.5 font-mono text-[#0a0a0a]">
          <span className="text-center font-semibold text-base leading-tight">
            {stamp.name}
          </span>
          <span className="text-center text-xs leading-tight">
            {stamp.description}
          </span>
        </div>
      )}
    </div>
  );
}

