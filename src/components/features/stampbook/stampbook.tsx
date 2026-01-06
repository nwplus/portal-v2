import type { StampWithUnlockState } from "@/lib/firebase/types/stamps";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { forwardRef, useCallback, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import { StampbookPage } from "./stampbook-page";
import { organizeIntoSpreads } from "./utils";

interface StampbookProps {
  stamps: StampWithUnlockState[];
  displayName: string;
}

// react-pageflip requires forwardRef wrapper for page components
const Page = forwardRef<HTMLDivElement, { children: React.ReactNode }>(({ children }, ref) => (
  <div ref={ref}>{children}</div>
));
Page.displayName = "Page";

export function Stampbook({ stamps, displayName }: StampbookProps) {
  // Should not display isHidden stamps that are not unlocked
  const stampsToDisplay = stamps.filter((stamp) => !stamp.isHidden || stamp.isUnlocked);
  const spreads = organizeIntoSpreads(stampsToDisplay);

  // biome-ignore lint/suspicious/noExplicitAny: react-pageflip doesn't export proper types
  const bookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const pages = spreads.flatMap((spread, spreadIndex) => [
    {
      id: `left-${spreadIndex}`,
      layout: spread.isTitleSpread ? ("title" as const) : ("grid" as const),
      stamps: spread.leftPage,
      title: spread.isTitleSpread ? `${displayName}'s stampbook` : undefined,
      isLeft: true,
    },
    {
      id: `right-${spreadIndex}`,
      layout: "grid" as const,
      stamps: spread.rightPage,
      title: undefined,
      isLeft: false,
    },
  ]);

  const handleFlip = useCallback((e: { data: number }) => {
    setCurrentPage(e.data);
  }, []);

  const handlePrev = () => {
    bookRef.current?.pageFlip()?.flipPrev();
  };

  const handleNext = () => {
    bookRef.current?.pageFlip()?.flipNext();
  };

  const canGoBack = currentPage > 1;
  const canGoForward = currentPage < pages.length - 2;

  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-text-secondary">No stamps available yet.</p>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center gap-4 py-8">
      <button
        onClick={handlePrev}
        disabled={!canGoBack}
        className={cn(
          "rounded-full p-2 transition-all",
          canGoBack
            ? "cursor-pointer text-text-primary hover:bg-text-primary/10"
            : "cursor-not-allowed text-text-secondary/30",
        )}
        aria-label="Previous page"
        type="button"
      >
        <ChevronLeft size={40} strokeWidth={1.5} />
      </button>

      <div className="relative overflow-hidden rounded-lg shadow-md">
        {/* @ts-expect-error - react-pageflip types are incomplete */}
        <HTMLFlipBook
          ref={bookRef}
          width={480}
          height={600}
          size="fixed"
          minWidth={480}
          maxWidth={480}
          minHeight={600}
          maxHeight={600}
          showCover={false}
          mobileScrollSupport={true}
          flippingTime={450}
          useMouseEvents={true}
          swipeDistance={30}
          onFlip={handleFlip}
          startPage={0}
          drawShadow={true}
          maxShadowOpacity={0.15}
          usePortrait={false}
          startZIndex={0}
          autoSize={false}
          clickEventForward={false}
          showPageCorners={true}
          disableFlipByClick={true}
        >
          {pages.map((page) => (
            <Page key={page.id}>
              <StampbookPage
                layout={page.layout}
                stamps={page.stamps}
                title={page.title}
                className={page.isLeft ? "rounded-r-sm rounded-l-lg" : "rounded-r-lg rounded-l-sm"}
              />
            </Page>
          ))}
        </HTMLFlipBook>
      </div>

      <button
        onClick={handleNext}
        disabled={!canGoForward}
        className={cn(
          "rounded-full p-2 transition-all",
          canGoForward
            ? "cursor-pointer text-text-primary hover:bg-text-primary/10"
            : "cursor-not-allowed text-text-secondary/30",
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
              onClick={() => bookRef.current?.pageFlip()?.turnToPage(index * 2)}
              className={cn(
                "h-2 w-2 rounded-full transition-all",
                Math.floor(currentPage / 2) === index
                  ? "bg-text-primary"
                  : "bg-text-secondary/40 hover:bg-text-secondary/60",
              )}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
