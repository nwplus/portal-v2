import { Button } from "@/components/ui/button";
import { Sticker } from "lucide-react";
import { useState } from "react";

interface CustomizationProps {
  onStickerSelect: (src: string) => void;
  onFontChange?: (fontKey: "caveat" | "ibm" | "space") => void;
  onCancel: () => void;
  onSave: () => void;
}

export function Customization({
  onStickerSelect,
  onFontChange,
  onCancel,
  onSave,
}: CustomizationProps) {
  const [isStickerSelected, setStickerSelected] = useState(false);
  const handleStickerClick = () => {
    setStickerSelected(!isStickerSelected);
  };

  const STICKERS = [
    "/assets/stickers/cool.png",
    "/assets/stickers/love.png",
    "/assets/stickers/slay.png",
    "/assets/stickers/star.png",
    "/assets/stickers/yay.png",
    "/assets/stickers/bufo.png",
    "/assets/stickers/catto.png",
    "/assets/stickers/fire.png",
    "/assets/stickers/nugget.png",
  ];

  const handleFontClick = (key: "caveat" | "ibm" | "space") => {
    onFontChange?.(key);
  };

  return (
    <div className="flex justify-center">
      <div className="relative w-[900px]">
        {isStickerSelected && (
          <div className="-top-16 absolute left-0 flex gap-2 rounded-2xl border border-[#2c2c2c] bg-[#1f1f1f] px-3 py-2 shadow-lg">
            {STICKERS.map((src) => (
              <button
                key={src}
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-transparent transition-transform hover:scale-110"
                aria-label="Select sticker"
                onClick={() => onStickerSelect(src)}
              >
                <img src={src} alt="Sticker option" className="h-8 w-8 object-contain" />
              </button>
            ))}
          </div>
        )}

        {/* sticker + font controls + save */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleStickerClick}
              className={`h-[46px] w-[46px] cursor-pointer rounded-lg border-[1px] px-3 py-2 transition-colors ${
                isStickerSelected ? "border-border-active" : "border-border-subtle"
              } bg-bg-dropdown-selected`}
              aria-label="Stickers"
            >
              <Sticker size={22} />
            </button>

            {/* Font picker */}
            <div className="flex h-[46px] items-center gap-2 rounded-lg border-[1px] border-border-subtle bg-bg-dropdown-selected">
              <button
                type="button"
                aria-label="Caveat font"
                onClick={() => handleFontClick("caveat")}
                className="rounded-md px-3 py-1 font-caveat text-2xl transition-shadow"
              >
                Aa
              </button>
              |
              <button
                type="button"
                aria-label="IBM Plex Mono font"
                onClick={() => handleFontClick("ibm")}
                className="rounded-md px-3 py-1 font-ibm-plex-mono text-2xl transition-shadow"
              >
                Aa
              </button>
              |
              <button
                type="button"
                aria-label="Space Grotesk font"
                onClick={() => handleFontClick("space")}
                className="rounded-md px-3 py-1 font-space-grotesk text-2xl transition-shadow"
              >
                Aa
              </button>
            </div>
          </div>
          <div>
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onSave}>
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
