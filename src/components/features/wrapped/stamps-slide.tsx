import { CompCanvas } from "@/components/features/wrapped/comp-canvas";
import type { WrappedStamp } from "@/lib/firebase/types/wrapped";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

/**
 * The stamps the hacker collected, laid into two ring-bound stampbooks.
 *
 * Built from the "stamps collected" frame in Figma's Hacker Wrapped "Final Handoff"
 * section, laid out in comp pixels. Each book holds two rows of four. Only collected
 * stamps appear, filling the slots in order; the rest stay empty but keep their space so
 * the rows hold their layout. Images are each stamp's `Stamps/{id}.imgURL`, copied onto
 * the deck doc by the batch script.
 *
 * The rings are a mesh-gradient shader in Figma; they ship as a rasterised PNG here.
 */

const ASSETS = "/assets/wrapped/stamps";
const SLOTS_PER_ROW = 4;
const RING_COUNT = 5;

const TIMING = {
  title: 0,
  topBook: 250,
  bottomBook: 550,
  /** First stamp lands after both books; each next one follows by `stampStep`. */
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

export function StampsSlide({ stamps, active }: { stamps: WrappedStamp[]; active: boolean }) {
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
          </div>
          <div
            className="absolute inset-0"
            style={enter("wrapped-slide-right", TIMING.topBook, 900)}
          >
            <TopBook />
          </div>

          {BOOKS.map((book, bookIndex) =>
            book.rows.map((row, rowIndex) => {
              const rowStart = (bookIndex * 2 + rowIndex) * SLOTS_PER_ROW;
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
                          stamp={stamps[index] ?? null}
                          imageRotate={book.imageRotate}
                          delay={TIMING.stamps + index * TIMING.stampStep}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            }),
          )}

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

function StampSlot({
  stamp,
  imageRotate,
  delay,
}: {
  stamp: WrappedStamp | null;
  imageRotate: number;
  delay: number;
}) {
  // Uncollected slots keep their width so the collected ones stay where the design puts them.
  if (!stamp) return <div className="w-[196px] shrink-0" />;

  return (
    <div className="flex w-[196px] shrink-0 justify-center">
      <div className="flex w-[182.667px] rotate-[3.49deg] flex-col items-center gap-[13px]">
        <div
          className="size-[150px] rounded-full bg-[#c9b8f5]"
          style={{ rotate: `${imageRotate}deg`, ...enter("wrapped-stamp", delay, 600) }}
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
        <p
          className="w-full break-words text-center font-semibold text-[#000] text-[30px] leading-[28px] tracking-[0.5912px]"
          style={enter("wrapped-fade", delay + 200, 500)}
        >
          {stamp.name}
        </p>
      </div>
    </div>
  );
}

function Rings({ className }: { className?: string }) {
  return (
    <div className={cn("flex w-[74.012px] flex-col gap-[98px]", className)}>
      {Array.from({ length: RING_COUNT }, (_, i) => (
        <img
          // biome-ignore lint/suspicious/noArrayIndexKey: identical, fixed decorations
          key={i}
          alt=""
          src={`${ASSETS}/ring.png`}
          className="block h-[35px] w-[56px] max-w-none"
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
      <div className="absolute top-[386.43px] left-[1012.37px] flex h-[566.459px] w-[108.114px] items-center justify-center">
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
      <div className="absolute top-[1179.57px] left-[-19.33px] flex h-[566.313px] w-[106.107px] items-center justify-center">
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
