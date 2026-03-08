import { useIsMobile } from "@/hooks/use-mobile";
import type { StampWithUnlockState } from "@/lib/firebase/types/stamps";
import { cn } from "@/lib/utils";
import { toPng } from "html-to-image";
import { Download, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { StampbookShareCard } from "./stampbook-share-card";

/**
 * Component to handle download actions for stampbook to share on social media
 */
const preloadImages = async (element: HTMLElement): Promise<void> => {
  const images = Array.from(element.querySelectorAll("img"));

  await Promise.all(
    images.map(async (img) => {
      if (img.src.startsWith("data:")) return;
      try {
        const res = await fetch(img.src);
        const blob = await res.blob();
        img.src = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch {
        console.warn("Failed to inline image:", img.src);
      }
    }),
  );
};

interface StampbookActionsProps {
  stamps: StampWithUnlockState[];
  displayName: string;
  hackathonId?: string;
}

export function StampbookActions({ stamps, displayName, hackathonId }: StampbookActionsProps) {
  const isMobile = useIsMobile();
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [canShare, setCanShare] = useState(!isMobile);

  useEffect(() => {
    if (!isMobile) {
      setCanShare(true);
      return;
    }

    setCanShare(false);
    const timeout = setTimeout(() => setCanShare(true), 9_000);
    return () => clearTimeout(timeout);
  }, [isMobile]);

  const handleShare = async () => {
    if (!shareCardRef.current) return;

    try {
      await preloadImages(shareCardRef.current);

      const dataUrl = await toPng(shareCardRef.current, { pixelRatio: 2 });
      const fileName = `${displayName.replace(/\s+/g, "-").toLowerCase()}-stampbook.png`;

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: "image/png" });

      if (isMobile && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${displayName}'s Stampbook` });
      } else {
        const link = document.createElement("a");
        link.download = fileName;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("Failed to share stampbook image:", err);
    }
  };

  return (
    <>
      <div className="-left-[9999px] -top-[9999px] pointer-events-none fixed" aria-hidden="true">
        <StampbookShareCard
          ref={shareCardRef}
          stamps={stamps}
          displayName={displayName}
          hackathonId={hackathonId}
        />
      </div>
      <button
        type="button"
        onClick={handleShare}
        disabled={!canShare}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border-subtle px-4 py-2 font-medium text-sm transition-all",
          "bg-bg-button-secondary text-text-primary",
          canShare
            ? "hover:bg-bg-button-secondary/80 active:scale-98"
            : "cursor-not-allowed opacity-50",
        )}
      >
        {isMobile ? <Share2 size={16} /> : <Download size={16} />}
        {isMobile ? (canShare ? "Share Stampbook" : "Pre-loading...") : "Download Stampbook"}
      </button>
    </>
  );
}
