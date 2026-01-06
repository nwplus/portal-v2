import type { StampWithUnlockState } from "@/lib/firebase/types/stamps";
import { cn } from "@/lib/utils";
import { StampDisplay } from "./stamp-display";

type PageLayout = "single" | "grid" | "title";

interface StampbookPageProps {
  layout: PageLayout;
  stamps?: StampWithUnlockState[];
  title?: string;
  className?: string;
}

export function StampbookPage({ layout, stamps = [], title, className }: StampbookPageProps) {
  const titleIndex = stamps.findIndex((stamp) => stamp.isTitle) ?? 0;

  return (
    <div className={cn("relative flex h-[600px] w-[480px] flex-col bg-[#F3EBEA] p-6", className)}>
      {/* <div className="pointer-events-none absolute inset-5 rounded-sm border-2 border-[#B8D4E8]/60 border-dashed" /> */}

      <div className="relative flex flex-1 flex-col items-center justify-center">
        {layout === "title" && title && (
          <div className="flex h-full flex-col items-center justify-center gap-8">
            <div className="font-bold font-mono text-[#8A8A8A] text-xl tracking-wide">{title}</div>

            {stamps[titleIndex] && (
              <div className="flex flex-col items-center gap-4">
                <StampDisplay stamp={stamps[titleIndex]} showDetails={false} />
                <span className="max-w-48 text-center font-mono text-[#4A4A4A] text-sm">
                  {stamps[titleIndex].description}
                </span>
              </div>
            )}
          </div>
        )}

        {layout === "single" && stamps[0] && (
          <div className="flex h-full items-center justify-center">
            <StampDisplay stamp={stamps[0]} />
          </div>
        )}

        {layout === "grid" && (
          <div className="grid grid-cols-2 place-items-center gap-x-12 gap-y-6">
            {stamps.slice(0, 4).map((stamp) => (
              <StampDisplay key={stamp._id} stamp={stamp} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
