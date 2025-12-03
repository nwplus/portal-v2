import { cn } from "@/lib/utils";

interface ProgressBarProps {
  step: 1 | 2 | 3 | 4;
  orientation?: "vertical" | "horizontal";
}

export function ProgressBar({ step, orientation = "vertical" }: ProgressBarProps) {
  const isHorizontal = orientation === "horizontal";

  return (
    <div
      className={cn(
        "flex justify-center gap-3",
        isHorizontal ? "w-full flex-row" : "h-full flex-col",
      )}
    >
      {[1, 2, 3, 4].map((oval) => (
        <div
          key={oval}
          className={cn(
            "relative overflow-hidden rounded-full [background:var(--progress-bar-incomplete)]",
            isHorizontal ? "h-1.5 w-[25%]" : "h-[15%] w-2",
          )}
        >
          <div
            className={cn(
              "absolute inset-0 rounded-full transition-transform duration-700 ease-out [background:var(--progress-bar-complete)]",
              isHorizontal
                ? cn("origin-left", oval <= step ? "scale-x-100" : "scale-x-0")
                : cn("origin-top", oval <= step ? "scale-y-100" : "scale-y-0"),
            )}
          />
        </div>
      ))}
    </div>
  );
}
