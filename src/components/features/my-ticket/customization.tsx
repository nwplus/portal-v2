import { Sticker } from "lucide-react";
import { useState } from "react";

interface CustomizationProps {
  onStickerSelect: (src: string) => void;
}

export function Customization({ onStickerSelect }: CustomizationProps) {
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
  ];

  return (
    <div className="mx-40">
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
        <button
          type="button"
          onClick={handleStickerClick}
          className={`h-[46px] w-[46px] cursor-pointer rounded-lg border-[1px] px-3 py-2 transition-colors ${
            isStickerSelected ? "border-[#f5f5f5]" : "border-[#e4e4e740]"
          } bg-[#262626]`}
        >
          <Sticker size={22} />
        </button>
        <button type="button">Save</button>
      </div>
    </div>
  );
}
