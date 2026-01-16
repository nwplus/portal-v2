import { useIsMobile } from "@/hooks/use-mobile";
import type { StampWithUnlockState } from "@/lib/firebase/types/stamps";
import { cn } from "@/lib/utils";
import { toPng } from "html-to-image";
import { ChevronLeft, ChevronRight, Download, HelpCircle, Share2 } from "lucide-react";
import { forwardRef, useCallback, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import { StampbookPage } from "./stampbook-page";
import { StampbookShareCard } from "./stampbook-share-card";
import { organizeIntoSpreads } from "./utils";

const DESKTOP_PAGE_WIDTH = 480;
const DESKTOP_PAGE_HEIGHT = 600;
const MOBILE_PAGE_WIDTH = 320;
const MOBILE_PAGE_HEIGHT = 420;

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
  const isMobile = useIsMobile();

  const pageWidth = isMobile ? MOBILE_PAGE_WIDTH : DESKTOP_PAGE_WIDTH;
  const pageHeight = isMobile ? MOBILE_PAGE_HEIGHT : DESKTOP_PAGE_HEIGHT;

  const stampsToDisplay = stamps.filter((stamp) => !stamp.isHidden || stamp.isUnlocked);
  const spreads = organizeIntoSpreads(stampsToDisplay);

  // biome-ignore lint/suspicious/noExplicitAny: react-pageflip doesn't export proper types
  const bookRef = useRef<any>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const handleShare = async () => {
    if (!shareCardRef.current) return;

    try {
      const dataUrl = await toPng(shareCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const fileName = `${displayName.replace(/\s+/g, "-").toLowerCase()}-stampbook.png`;

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: "image/png" });

      // Use native share sheet only on mobile if available, else download
      if (isMobile && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${displayName}'s Stampbook`,
        });
      } else {
        const link = document.createElement("a");
        link.download = fileName;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      // exclude user cancelling share as an error
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("Failed to share stampbook image:", err);
    }
  };

  const allPages = spreads.flatMap((spread, spreadIndex) => [
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

  // Filter out empty pages on mobile
  const pages = isMobile ? allPages.filter((page) => page.stamps.length > 0) : allPages;

  const handleFlip = useCallback((e: { data: number }) => {
    setCurrentPage(e.data);
  }, []);

  const handlePrev = () => {
    const pageFlip = bookRef.current?.pageFlip();
    if (!pageFlip) return;

    // flipPrev() doesn't work on mobile for some reason; we explicitly use turnToPage()
    // TODO: 'back' animation doesn't work if using turnToPage()
    if (isMobile) {
      const targetPage = Math.max(0, currentPage - 1);
      pageFlip.turnToPage(targetPage);
    } else {
      pageFlip.flipPrev();
    }
  };

  const handleNext = () => {
    bookRef.current?.pageFlip()?.flipNext();
  };

  // Navigation logic differs between mobile (portrait/single page) and desktop (spread/two pages)
  // Potrait (mobile): pages are navigated one at a time
  // Spread (desktop): pages are navigated two at a time (starts showing pages 0-1, then 2-3, etc.)
  const canGoBack = isMobile ? currentPage > 0 : currentPage > 1;
  const canGoForward = isMobile ? currentPage < pages.length - 1 : currentPage < pages.length - 2;

  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-text-secondary">No stamps available yet.</p>
      </div>
    );
  }

  const PrevButton = (
    <button
      onClick={handlePrev}
      disabled={!canGoBack}
      className={cn(
        "select-none rounded-full p-2 transition-all",
        isMobile && "min-h-10 min-w-10",
        canGoBack
          ? "text-text-primary hover:bg-text-primary/10 active:bg-text-primary/20"
          : "text-text-secondary/30",
      )}
      aria-label="Previous page"
      type="button"
    >
      <ChevronLeft size={isMobile ? 24 : 40} strokeWidth={1.5} />
    </button>
  );

  const NextButton = (
    <button
      onClick={handleNext}
      disabled={!canGoForward}
      className={cn(
        "select-none rounded-full p-2 transition-all",
        isMobile && "min-h-10 min-w-10",
        canGoForward
          ? "text-text-primary hover:bg-text-primary/10 active:bg-text-primary/20"
          : "text-text-secondary/30",
      )}
      aria-label="Next page"
      type="button"
    >
      <ChevronRight size={isMobile ? 24 : 40} strokeWidth={1.5} />
    </button>
  );

  const PageIndicators = (isMobile ? pages.length > 1 : spreads.length > 1) && (
    <div className="flex gap-2">
      {isMobile
        ? pages.map((_, index) => (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: page indicators are positional and don't reorder
              key={`page-indicator-${index}`}
              type="button"
              onClick={() => bookRef.current?.pageFlip()?.turnToPage(index)}
              className={cn(
                "h-2 w-2 rounded-full transition-all",
                currentPage === index
                  ? "bg-text-primary"
                  : "bg-text-secondary/40 hover:bg-text-secondary/60",
              )}
              aria-label={`Go to page ${index + 1}`}
            />
          ))
        : spreads.map((_, index) => (
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
  );

  const FlipBook = (
    <div className="overflow-hidden rounded-lg shadow-md">
      {/* @ts-expect-error - react-pageflip types are incomplete */}
      <HTMLFlipBook
        ref={bookRef}
        width={pageWidth}
        height={pageHeight}
        size="fixed"
        minWidth={pageWidth}
        maxWidth={pageWidth}
        minHeight={pageHeight}
        maxHeight={pageHeight}
        showCover={false}
        mobileScrollSupport={false}
        flippingTime={450}
        useMouseEvents={true}
        swipeDistance={30}
        onFlip={handleFlip}
        startPage={0}
        drawShadow={true}
        maxShadowOpacity={0.15}
        usePortrait={isMobile}
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
              width={pageWidth}
              height={pageHeight}
              className={page.isLeft ? "rounded-r-md rounded-l-lg" : "rounded-r-lg rounded-l-md"}
            />
          </Page>
        ))}
      </HTMLFlipBook>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="-left-[9999px] -top-[9999px] pointer-events-none fixed" aria-hidden="true">
        <StampbookShareCard ref={shareCardRef} stamps={stampsToDisplay} displayName={displayName} />
      </div>

      <div className="max-w-sm px-6 sm:px-10 md:max-w-4xl md:text-center">
        <p className="text-text-secondary text-xs md:text-sm">
          <HelpCircle className="mr-1 hidden h-4 w-4 md:inline-block" />
          There are many ways to unlock these stamps, and each one earns you a ticket to our{" "}
          <span className="font-bold">prize raffle!</span> Click the icons beside a stamp to learn
          how to earn it. Some stamps are hidden, so it's up to you to discover them.
          <span className="font-bold md:font-normal">
            <br className="md:hidden" />
            <br className="md:hidden" /> Try to collect them all!
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={handleShare}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border-subtle px-4 py-2 font-medium text-sm transition-all",
          "bg-bg-button-secondary text-text-primary",
          "hover:bg-bg-button-secondary/80 active:scale-98",
        )}
      >
        {isMobile ? <Share2 size={16} /> : <Download size={16} />}
        {isMobile ? "Share Stampbook" : "Download Stampbook"}
      </button>
      {isMobile ? (
        <div className="flex flex-col items-center gap-6 py-4">
          {FlipBook}
          <div className="flex items-center gap-6">
            {PrevButton}
            {PageIndicators}
            {NextButton}
          </div>
        </div>
      ) : (
        <div className="relative flex items-center justify-center gap-4 py-8">
          {PrevButton}
          {FlipBook}
          {NextButton}
          <div className="-translate-x-1/2 absolute bottom-0 left-1/2">{PageIndicators}</div>
        </div>
      )}
    </div>
  );
}
