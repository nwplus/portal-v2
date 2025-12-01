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
          className="relative h-[15%] w-2 overflow-hidden rounded-full [background:var(--progress-bar-incomplete)]"
        >
          <div
            className={cn(
              "absolute inset-0 origin-top rounded-full transition-transform duration-500 ease-out [background:var(--progress-bar-complete)]",
              oval <= step ? "scale-y-100" : "scale-y-0",
            )}
            style={{
              transitionDelay: oval <= step ? `${(oval - 1) * 100}ms` : "0ms",
            }}
          />
        </div>
      ))}
    </div>
  );
}
