import { cn } from "@/lib/utils";

interface ProgressBarProps {
  step: 1 | 2 | 3 | 4;
}

export function ProgressBar({ step }: ProgressBarProps) {
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      {[1, 2, 3, 4].map((oval) => (
        <div
          key={oval}
          className={cn(
            "h-[15%] w-2 rounded-full transition-colors",
            oval <= step
              ? "[background:var(--progress-bar-complete)]"
              : "[background:var(--progress-bar-incomplete)]",
          )}
        />
      ))}
    </div>
  );
}
