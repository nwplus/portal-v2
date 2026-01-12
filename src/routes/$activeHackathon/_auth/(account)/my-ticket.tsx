import { Countdown } from "@/components/features/my-ticket/countdown";
import { Customization } from "@/components/features/my-ticket/customization";
import { Message } from "@/components/features/my-ticket/message";
import { type PlacedSticker, Ticket } from "@/components/features/my-ticket/ticket";
import { GradientBackground } from "@/components/layout/gradient-background";
import { useHackerStore } from "@/lib/stores/hacker-store";
import { createFileRoute } from "@tanstack/react-router";
import { Palette } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/$activeHackathon/_auth/(account)/my-ticket")({
  component: RouteComponent,
});

function RouteComponent() {
  const hacker = useHackerStore((state) => state.hacker);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);

  if (!hacker) return null;

  const handleCustomizationClick = () => {
    setIsCustomizing(!isCustomizing);
  };

  const handleStickerSelect = (stickerSrc: string) => {
    const newSticker: PlacedSticker = {
      id: Date.now(),
      src: stickerSrc,
    };
    setPlacedStickers((prev) => [...prev, newSticker]);
  };

  return (
    <GradientBackground gradientPosition="bottomMiddle">
      <div className="flex flex-col gap-10 py-10 md:py-12">
        {isCustomizing ? (
          <div className="mx-auto flex flex-col items-center gap-2 pt-4">
            <div className="px-5 text-center text-4xl leading-12 md:px-0">
              Customize your ticket ✨
            </div>
          </div>
        ) : (
          <>
            <Countdown />
            <Message applicant={hacker} />
          </>
        )}
        <div className="flex justify-center gap-10">
          <Ticket applicant={hacker} placedStickers={placedStickers} />
          <div className="flex flex-col justify-center gap-5">
            <button
              type="button"
              onClick={handleCustomizationClick}
              className={`h-[46px] w-[46px] cursor-pointer rounded-lg border-[1px] px-3 py-2 transition-colors ${
                isCustomizing ? "border-[#f5f5f5]" : "border-[#e4e4e740]"
              } bg-[#262626]`}
            >
              <Palette size={22} />
            </button>
          </div>
        </div>
        {isCustomizing && <Customization onStickerSelect={handleStickerSelect} />}
      </div>
    </GradientBackground>
  );
}
