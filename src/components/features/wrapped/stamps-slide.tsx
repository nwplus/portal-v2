import { CompCanvas } from "@/components/features/wrapped/comp-canvas";
import { cn } from "@/lib/utils";
import type { StampSlot as StampSlotData } from "@/lib/wrapped/stamp-slots";
import type { CSSProperties } from "react";

/**
 * The event's stamps, laid into two ring-bound stampbooks: collected ones in colour,
 * the rest as their locked art.
 *
 * Built from the "stamps collected" frame in Figma's Hacker Wrapped "Final Handoff"
 * section, laid out in comp pixels. Each book holds two rows of five (the design's four,
 * narrowed), filled in order from `buildStampSlots` (`lib/wrapped/stamp-slots.ts`); slots
 * past the event's stamps stay blank but keep their space so the rows hold their layout.
 * `buildStampSlots` fits the book to 20 slots, dropping stamps not collected first. Art is read from `Stamps` when the deck loads, not
 * from the deck doc.
 *
 * Ordered by category, then name (`buildStampSlots`). Every slot's locked art and name are
 * printed on its book and slide in with it; collected stamps then paste their art over the
 * locked art, one by one, once both books have landed.
 *
 * The rings are a mesh-gradient shader in Figma; they ship as a PNG rasterised at 4x
 * from the shader's own parameters. Each ring is drawn as Figma lays it out for the top
 * book: the hole on the page side, the bar running out past the page edge. The bottom
 * book mirrors the column, so its holes sit on the right.
 */

const ASSETS = "/assets/wrapped/stamps";
const SLOTS_PER_ROW = 5;
const RING_COUNT = 5;

const TIMING = {
  title: 0,
  topBook: 250,
  bottomBook: 550,
  /** First collected stamp pastes in after both books land; each next follows by `stampStep`. */
  stamps: 1100,
  stampStep: 140,
} as const;

/** Where each book's two rows sit, and how they tilt with their page. */
const BOOKS = [
  {
    rows: [
      { x: 206.01, y: 389.45, w: 813.019, h: 319.506 },
      { x: 183.26, y: 677.85, w: 809.72, h: 291.506 },
    ],
    rowRotate: 3.28,
    imageRotate: -6.77,
  },
  {
    rows: [
      { x: 82.44, y: 1186.03, w: 806.493, h: 303.151 },
      { x: 87.91, y: 1464.08, w: 808.077, h: 303.242 },
    ],
    rowRotate: -3.28,
    imageRotate: -0.21,
  },
] as const;

function enter(name: string, delay: number, duration = 800): CSSProperties {
  return { animation: `${name} ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms both` };
}

export function StampsSlide({ slots, active }: { slots: StampSlotData[]; active: boolean }) {
  // Collected stamps paste in one after another, over locked art printed on their book.
  let pasted = 0;
  const pasteDelays = slots.map((slot) =>
    slot.collected ? TIMING.stamps + pasted++ * TIMING.stampStep : null,
  );
  const bookStamps = (bookIndex: number) => (
    <BookStamps bookIndex={bookIndex} slots={slots} pasteDelays={pasteDelays} />
  );

  return (
    <CompCanvas className="bg-[#2c2543]">
      {active && (
        <div className="absolute inset-0 font-['Hanken_Grotesk']">
          <Backdrop />

          <div
            className="absolute inset-0"
            style={enter("wrapped-slide-left", TIMING.bottomBook, 900)}
          >
            <BottomBook />
            {bookStamps(1)}
          </div>
          <div
            className="absolute inset-0"
            style={enter("wrapped-slide-right", TIMING.topBook, 900)}
          >
            <TopBook />
            {bookStamps(0)}
          </div>

          <p
            className="-translate-x-1/2 -translate-y-1/2 absolute top-[194.5px] left-1/2 w-[816px] text-center font-bold text-[#fff] text-[100px] leading-[82.773px] tracking-[0.5912px]"
            style={enter("wrapped-rise", TIMING.title)}
          >
            Stamps Collected
          </p>
        </div>
      )}
    </CompCanvas>
  );
}

/** One book's two rows, drawn inside the book so they move with it. */
function BookStamps({
  bookIndex,
  slots,
  pasteDelays,
}: {
  bookIndex: number;
  slots: StampSlotData[];
  pasteDelays: (number | null)[];
}) {
  const book = BOOKS[bookIndex];
  return book.rows.map((row, rowIndex) => {
    const rowStart = (bookIndex * book.rows.length + rowIndex) * SLOTS_PER_ROW;
    return (
      <div
        key={`${row.x}-${row.y}`}
        className="absolute flex items-center justify-center"
        style={{ left: row.x, top: row.y, width: row.w, height: row.h }}
      >
        <div
          className="flex flex-none items-start justify-center gap-[4px]"
          style={{ rotate: `${book.rowRotate}deg` }}
        >
          {Array.from({ length: SLOTS_PER_ROW }, (_, slot) => {
            const index = rowStart + slot;
            return (
              <StampSlot
                key={index}
                stamp={slots[index] ?? null}
                imageRotate={book.imageRotate}
                pasteDelay={pasteDelays[index] ?? null}
              />
            );
          })}
        </div>
      </div>
    );
  });
}

function StampSlot({
  stamp,
  imageRotate,
  pasteDelay,
}: {
  stamp: StampSlotData | null;
  imageRotate: number;
  /** When a collected stamp pastes in; null for a locked one, which needs no entrance. */
  pasteDelay: number | null;
}) {
  // Slots past the event's stamps stay blank but keep their width, so the rest hold the layout.
  if (!stamp) return <div className="w-[158px] shrink-0" />;

  return (
    <div className="flex w-[158px] shrink-0 justify-center">
      <div className="flex w-[152px] rotate-[3.49deg] flex-col items-center gap-[12px]">
        {/* Every slot's locked art and name are printed on the page; a collected stamp
            pastes its own art over the locked art. */}
        <div className="relative size-[128px]" style={{ rotate: `${imageRotate}deg` }}>
          <img
            alt={stamp.collected ? "" : `${stamp.name} (not collected)`}
            src={stamp.lockedImgURL}
            className="block size-full rounded-full object-cover"
            draggable={false}
          />
          {stamp.collected && (
            <div
              className={cn("absolute inset-0 rounded-full", !stamp.imgURL && "bg-[#c9b8f5]")}
              style={pasteDelay !== null ? enter("wrapped-stamp", pasteDelay, 600) : undefined}
            >
              {stamp.imgURL && (
                <img
                  alt={stamp.name}
                  src={stamp.imgURL}
                  className="block size-full rounded-full object-cover"
                  draggable={false}
                />
              )}
            </div>
          )}
        </div>
        {/* Wider than the stamp column, up to the slot pitch, so the longest words in the
            event's names ("Superpowers!") fit on a line instead of breaking. */}
        <p className="w-[160px] shrink-0 break-words text-center font-semibold text-[#000] text-[24px] leading-[24px] tracking-[0.5912px]">
          {stamp.name}
        </p>
      </div>
    </div>
  );
}

function Rings({ className }: { className?: string }) {
  return (
    <div className={cn("flex w-[74.012px] flex-col gap-[102px]", className)}>
      {Array.from({ length: RING_COUNT }, (_, i) => (
        <img
          // biome-ignore lint/suspicious/noArrayIndexKey: identical, fixed decorations
          key={i}
          alt=""
          src={`${ASSETS}/ring.png`}
          className="block h-[31px] w-[74.012px] max-w-none"
          draggable={false}
        />
      ))}
    </div>
  );
}

const PAGE_FILL =
  "bg-gradient-to-l from-[#d0bdff] to-[#e2d6ff] rounded-tl-[24px] rounded-tr-[8px] rounded-br-[8px]";

function TopBook() {
  return (
    <>
      <div className="absolute top-[299px] left-[111.52px] flex h-[759.327px] w-[988.599px] items-center justify-center">
        <img
          alt=""
          src={`${ASSETS}/top-back-3.svg`}
          className="h-[703px] w-[947.601px] max-w-none flex-none rotate-[3.49deg]"
        />
      </div>
      <div className="absolute top-[300.26px] left-[132.26px] flex h-[758.064px] w-[967.864px] items-center justify-center">
        <img
          alt=""
          src={`${ASSETS}/top-back-2.svg`}
          className="h-[703px] w-[926.827px] max-w-none flex-none rotate-[3.49deg]"
        />
      </div>
      <div className="absolute top-[301.56px] left-[153.58px] flex h-[758.162px] w-[969.485px] items-center justify-center">
        <div
          className={cn(
            "-scale-y-100 h-[703px] w-[928.45px] flex-none rotate-[-176.51deg]",
            PAGE_FILL,
          )}
        />
      </div>
      {/* Figma's position moved 37px down the page, so the space above the top ring
          equals the space below the bottom one. */}
      <div className="absolute top-[423.38px] left-[1010.12px] flex h-[566.459px] w-[108.114px] items-center justify-center">
        <Rings className="flex-none rotate-[3.49deg]" />
      </div>
    </>
  );
}

function BottomBook() {
  return (
    <>
      <div className="absolute top-[1095.91px] left-[-49.81px] flex h-[757.84px] w-[1017.132px] items-center justify-center">
        <img
          alt=""
          src={`${ASSETS}/bottom-back-3.svg`}
          className="-scale-y-100 h-[703px] w-[978.508px] max-w-none flex-none rotate-[176.72deg]"
        />
      </div>
      <div className="absolute top-[1097.14px] left-[-49.81px] flex h-[756.613px] w-[995.716px] items-center justify-center">
        <img
          alt=""
          src={`${ASSETS}/bottom-back-2.svg`}
          className="-scale-y-100 h-[703px] w-[957.057px] max-w-none flex-none rotate-[176.72deg]"
        />
      </div>
      <div className="absolute top-[1098.47px] left-[-50.22px] flex h-[755.374px] w-[974.107px] items-center justify-center">
        <div className={cn("h-[703px] w-[935.413px] flex-none rotate-[-3.28deg]", PAGE_FILL)} />
      </div>
      {/* Moved 36px down the page to centre the rings between its edges, and 19px out
          past the left edge so the bottom ring is cut off as far as the top book's is. */}
      <div className="absolute top-[1217.06px] left-[-36.26px] flex h-[566.313px] w-[106.107px] items-center justify-center">
        <Rings className="-scale-y-100 flex-none rotate-[176.72deg]" />
      </div>
    </>
  );
}

/** Textures, glow and stars behind the books. */
function Backdrop() {
  return (
    <div className="absolute inset-0" style={enter("wrapped-fade", 0, 1200)}>
      <img
        alt=""
        src={`${ASSETS}/texture-green.png`}
        className="absolute top-0 left-[540px] h-[849px] w-[540px] max-w-none"
      />
      <img
        alt=""
        src={`${ASSETS}/texture-red.png`}
        className="absolute top-[590px] left-0 h-[783px] w-[516px] max-w-none"
      />
      <img
        alt=""
        src={`${ASSETS}/texture-purple.png`}
        className="absolute top-[1317px] left-[602px] h-[603px] w-[478px] max-w-none"
      />

      <div className="absolute top-[-144px] left-[-424px] flex h-[689.227px] w-[1343.147px] items-center justify-center mix-blend-soft-light">
        <div
          className="h-[444.914px] w-[1280.469px] flex-none rotate-[-11.4deg] opacity-75"
          style={{
            backgroundImage:
              "radial-gradient(closest-side, rgba(111,0,252,1) 0%, rgba(147,46,244,0.75) 25%, rgba(183,93,235,0.5) 50%, rgba(255,186,219,0) 100%)",
          }}
        />
      </div>

      <img
        alt=""
        src={`${ASSETS}/star-small.svg`}
        className="wrapped-twinkle absolute top-[1831px] left-[80px] size-[56px]"
      />
      <img
        alt=""
        src={`${ASSETS}/star-small.svg`}
        className="wrapped-twinkle absolute top-[1289px] left-[1003px] size-[56px]"
      />
      <img
        alt=""
        src={`${ASSETS}/star-small.svg`}
        className="wrapped-twinkle absolute top-[74px] left-[954px] size-[56px]"
      />
      <img
        alt=""
        src={`${ASSETS}/star-large.svg`}
        className="wrapped-twinkle absolute top-[640px] left-[29px] size-[82.74px]"
      />
      {[
        [367, 1018],
        [953, 1813],
      ].map(([x, y]) => (
        <div
          key={`${x}-${y}`}
          className="absolute flex size-[38.845px] items-center justify-center"
          style={{ left: x, top: y }}
        >
          <img
            alt=""
            src={`${ASSETS}/shooting-star.svg`}
            className="h-[46.483px] w-[8.452px] max-w-none flex-none rotate-45"
          />
        </div>
      ))}
    </div>
  );
}
