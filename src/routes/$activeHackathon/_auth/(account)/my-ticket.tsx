import { Countdown } from "@/components/features/my-ticket/countdown";
import { Customization } from "@/components/features/my-ticket/customization";
import { Message } from "@/components/features/my-ticket/message";
import { type PlacedSticker, Ticket } from "@/components/features/my-ticket/ticket";
import { GradientBackground } from "@/components/layout/gradient-background";
import { useHackathon } from "@/hooks/use-hackathon";
import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import { useHackerStore } from "@/lib/stores/hacker-store";
import { addHackerPassToGoogleWallet } from "@/services/wallet";
import { createFileRoute } from "@tanstack/react-router";
import { toPng } from "html-to-image";
import { Download, Loader2, Palette } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/$activeHackathon/_auth/(account)/my-ticket")({
  component: RouteComponent,
});

function RouteComponent() {
  const hacker = useHackerStore((state) => state.hacker);
  const { activeHackathon } = useHackathon();
  const { dbCollectionName } = useHackathonInfo();
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);

  // Persisted sticker storage key
  const STORAGE_KEY = "ticketPlacedStickers";

  type FontKey = "caveat" | "ibm" | "space" | "default";

  // Initialize from localStorage (safe on SSR)
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as PlacedSticker[]) : [];
    } catch {
      return [];
    }
  });

  // persist selected font key in localStorage so customizations survive reload
  const [selectedFontKey, setSelectedFontKey] = useState<FontKey>(() => {
    if (typeof window === "undefined") return "default";
    const raw = localStorage.getItem("ticketFontKey");
    if (raw === "caveat" || raw === "ibm" || raw === "space" || raw === "default") {
      return raw;
    }
    return "default";
  });

  // Snapshot state for cancel functionality
  const [snapshotStickers, setSnapshotStickers] = useState<PlacedSticker[]>([]);
  const [snapshotFontKey, setSnapshotFontKey] = useState<FontKey>("default");

  if (!hacker) return null;

  const handleCustomizationClick = () => {
    if (!isCustomizing) {
      setSnapshotStickers(placedStickers);
      setSnapshotFontKey(selectedFontKey);
    }
    setIsCustomizing(!isCustomizing);
  };

  const handleStickerSelect = (stickerSrc: string) => {
    const newSticker: PlacedSticker = {
      id: Date.now(),
      src: stickerSrc,
    };
    setPlacedStickers((prev) => [...prev, newSticker]);
  };

  const handleFontChange = (fontKey: "caveat" | "ibm" | "space") => {
    setSelectedFontKey(fontKey);
  };

  const handlePlacedStickersChange = (next: PlacedSticker[]) => {
    setPlacedStickers(next);
  };

  const handleCancel = () => {
    setPlacedStickers(snapshotStickers);
    setSelectedFontKey(snapshotFontKey);
    setIsCustomizing(false);
  };

  const handleSave = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(placedStickers));
        localStorage.setItem("ticketFontKey", selectedFontKey);
      } catch {
        /* ignore */
      }
    }
    setIsCustomizing(false);
  };

  const downloadTicket = async () => {
    if (!ticketRef.current) return;

    const dataUrl = await toPng(ticketRef.current, {
      style: {
        borderRadius: "18px",
        overflow: "hidden",
      },
    });
    const link = document.createElement("a");
    link.download = `${hacker.basicInfo.preferredName || hacker.basicInfo.legalFirstName}${hacker.basicInfo.legalLastName}-QRCode.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleAddToGoogleWallet = async () => {
    if (!hacker?._id) return;
    setWalletLoading(true);
    try {
      const qrValue = `${window.location.origin}/${activeHackathon}/social-profile/${hacker._id}`;
      const saveUrl = await addHackerPassToGoogleWallet(dbCollectionName, qrValue);
      window.open(saveUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Failed to add pass to Google Wallet", error);
      toast.error("Couldn't add pass to Google Wallet. Please try again.");
    } finally {
      setWalletLoading(false);
    }
  };

  const selectedFontCss =
    selectedFontKey === "caveat"
      ? "var(--font-caveat)"
      : selectedFontKey === "ibm"
        ? "var(--font-ibm-plex-mono)"
        : selectedFontKey === "space"
          ? "var(--font-space-grotesk)"
          : undefined;

  return (
    <GradientBackground gradientPosition="bottomMiddle">
      <div className="flex flex-col gap-10 py-10 md:py-12">
        {isCustomizing ? (
          <div className="mx-auto flex flex-col items-center gap-2 pt-4">
            <div className="px-5 text-center text-4xl leading-12 md:px-0">
              Customize <span className="font-[family-name:var(--font-playwrite)]">your</span>{" "}
              ticket ✨
            </div>
          </div>
        ) : (
          <>
            <Countdown />
            <Message applicant={hacker} />
          </>
        )}
        <div className="flex justify-center gap-10">
          <div ref={ticketRef}>
            <Ticket
              applicant={hacker}
              placedStickers={placedStickers}
              selectedFont={selectedFontCss}
              onPlacedStickersChange={handlePlacedStickersChange}
              isCustomizing={isCustomizing}
            />
          </div>
          <div className="hidden flex-col justify-center gap-5 md:flex">
            <button
              type="button"
              onClick={handleCustomizationClick}
              className={`h-[46px] w-[46px] cursor-pointer rounded-lg border-[1px] px-3 py-2 transition-colors ${
                isCustomizing ? "border-border-active" : "border-border-subtle"
              } bg-bg-dropdown-selected`}
            >
              <Palette size={22} />
            </button>
            <button
              type="button"
              onClick={downloadTicket}
              className="h-[46px] w-[46px] cursor-pointer rounded-lg border border-border-subtle bg-bg-dropdown-selected px-3 py-2"
            >
              <Download size={22} />
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={downloadTicket}
          className="mx-auto h-[46px] w-[46px] cursor-pointer rounded-lg border border-border-subtle bg-bg-dropdown-selected px-3 py-2 md:hidden"
        >
          <Download size={22} />
        </button>
        <button
          type="button"
          onClick={handleAddToGoogleWallet}
          disabled={walletLoading}
          className="mx-auto flex cursor-pointer items-center justify-center border-none bg-transparent p-0 transition-opacity disabled:cursor-default disabled:opacity-50"
          aria-label="Add to Google Wallet"
        >
          {walletLoading ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <img
              src="/assets/wallet/add-to-wallet-button-primary.png"
              alt="Add to Google Wallet"
              className="h-[34px] w-auto"
            />
          )}
        </button>
        {isCustomizing && (
          <Customization
            onStickerSelect={handleStickerSelect}
            onFontChange={handleFontChange}
            onCancel={handleCancel}
            onSave={handleSave}
          />
        )}
      </div>
    </GradientBackground>
  );
}
