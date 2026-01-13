import { Sticker } from "lucide-react";
import { useState } from "react";

interface CustomizationProps {
  onStickerSelect: (src: string) => void;
  onFontChange?: (fontKey: "caveat" | "ibm" | "space") => void;
}

export function Customization({ onStickerSelect, onFontChange }: CustomizationProps) {
  const [isStickerSelected, setStickerSelected] = useState(false);
  const [selectedFont, setSelectedFont] = useState<"caveat" | "ibm" | "space" | null>(null);
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
    setSelectedFont(key);
    onFontChange?.(key);
  };

  return (
    <div className="mx-60">
      <div className="relative inline-block">
        {isStickerSelected && (
          <div className="-top-16 -translate-x-1/2 absolute left-1/2 flex gap-2 rounded-2xl border border-[#2c2c2c] bg-[#1f1f1f] px-3 py-2 shadow-lg">
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
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleStickerClick}
            className={`h-[46px] w-[46px] cursor-pointer rounded-lg border-[1px] px-3 py-2 transition-colors ${
              isStickerSelected ? "border-[#f5f5f5]" : "border-[#e4e4e740]"
            } bg-[#262626]`}
            aria-label="Stickers"
          >
            <Sticker size={22} />
          </button>

          {/* Font picker */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Caveat font"
              onClick={() => handleFontClick("caveat")}
              className={`rounded-md px-3 py-1 text-sm transition-shadow ${
                selectedFont === "caveat" ? "ring-2 ring-offset-1 ring-[#f5f5f5]" : "border border-transparent"
              }`}
              style={{ fontFamily: "var(--font-caveat)" }}
            >
              Aa
            </button>

            <button
              type="button"
              aria-label="IBM Plex Mono font"
              onClick={() => handleFontClick("ibm")}
              className={`rounded-md px-3 py-1 text-sm transition-shadow ${
                selectedFont === "ibm" ? "ring-2 ring-offset-1 ring-[#f5f5f5]" : "border border-transparent"
              }`}
              style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
            >
              Aa
            </button>

            <button
              type="button"
              aria-label="Space Grotesk font"
              onClick={() => handleFontClick("space")}
              className={`rounded-md px-3 py-1 text-sm transition-shadow ${
                selectedFont === "space" ? "ring-2 ring-offset-1 ring-[#f5f5f5]" : "border border-transparent"
              }`}
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Aa
            </button>
          </div>

          <button type="button" className="ml-2 rounded-md px-3 py-1 text-sm" aria-label="Save">
            Save
          </button>

          <button type="button" className="ml-2 rounded-md px-3 py-1 text-sm" aria-label="Save">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
