import { CompCanvas } from "@/components/features/wrapped/comp-canvas";
import type { ArchetypeId } from "@/lib/firebase/types/wrapped";
import { archetypeCopy } from "@/lib/wrapped/archetype-copy";
import type { CSSProperties } from "react";

/**
 * The archetype reveal: the hacker's archetype over a ship's hexagonal window onto space.
 *
 * Built from the "(Animation) Overall Archetype" frame in Figma's Hacker Wrapped "Final
 * Handoff" section, laid out in comp pixels. The ringed planet ("prizewinner icon" in
 * Figma, and the only icon drawn so far) starts off-canvas to the right and drifts past
 * through the window, so every archetype gets it until each has its own.
 */

const ASSETS = "/assets/wrapped/archetype";

/** The window's top-left in the comp; everything seen through it is placed relative to this. */
const WINDOW = { x: 84, y: 634, width: 912.358, height: 652.583 } as const;

/** The window's hexagon, from the Figma path, as a clip so space stays inside the frame. */
const WINDOW_CLIP =
  "polygon(24.834% 0%, 74.834% 0.22%, 100% 50.22%, 75.166% 100%, 25.166% 99.78%, 0% 49.78%)";

const TIMING = {
  rectangles: 0,
  window: 200,
  label: 900,
  description: 1500,
  icon: 500,
} as const;
/** How long the planet takes to drift across and out of the window. */
const ICON_FLOW_MS = 6500;

/** The label is set at 150px for "Prizewinner"; longer labels shrink to keep one line. */
const LABEL_SIZE = 150;
const LABEL_FIT_CHARS = 11;

const LIGHT_RECTANGLES = [
  { x: 821, y: 1574, w: 373, h: 39 },
  { x: -67, y: 1703, w: 373, h: 39 },
  { x: 932, y: 634, w: 373, h: 19 },
  { x: 830, y: 752, w: 373, h: 39 },
  { x: 0, y: 143, w: 373, h: 25 },
  { x: 623, y: 319, w: 611, h: 16 },
  { x: 718, y: 1256, w: 362, h: 39 },
] as const;

const DARK_RECTANGLES = [
  { x: -51, y: 1356, w: 1047, h: 151 },
  { x: 734, y: 1632, w: 373, h: 151 },
  { x: -129, y: 1030, w: 373, h: 107 },
  { x: -22, y: 1762, w: 373, h: 97 },
  { x: -85, y: 64, w: 500, h: 65 },
  { x: -250, y: 670, w: 1519, h: 65 },
  { x: 541, y: 360, w: 247, h: 65 },
] as const;

/** Small stars and dust inside the window, in comp coordinates. */
const WINDOW_SPARKS = [
  { src: "star-a", x: 776, y: 1165, w: 26, h: 29 },
  { src: "star-a", x: 230, y: 1062, w: 26, h: 29 },
  { src: "star-b", x: 651, y: 705, w: 14, h: 16 },
  { src: "star-c", x: 364, y: 758, w: 22, h: 25 },
  { src: "star-d", x: 885, y: 823, w: 35, h: 40 },
  { src: "dot-a", x: 650, y: 1169, w: 17, h: 17, overlay: true },
  { src: "dot-b", x: 310, y: 679, w: 8, h: 8, overlay: true },
  { src: "dot-c", x: 612, y: 881, w: 12, h: 12, overlay: true },
  { src: "dot-d", x: 247, y: 1153, w: 17, h: 17, overlay: true },
  { src: "dot-e", x: 910, y: 996, w: 22, h: 22, overlay: true },
] as const;

function enter(name: string, delay: number, duration = 800): CSSProperties {
  return { animation: `${name} ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms both` };
}

/** Splits "The Prizewinner" into its article and name; `ANCHOR` has no article. */
function splitLabel(label: string): { article: string | null; name: string } {
  const match = label.match(/^(The)\s+(.+)$/);
  return match ? { article: match[1], name: match[2] } : { article: null, name: label };
}

export function ArchetypeSlide({ archetype, active }: { archetype: ArchetypeId; active: boolean }) {
  const { label, description } = archetypeCopy(archetype);
  const { article, name } = splitLabel(label);
  const labelSize = Math.round(LABEL_SIZE * Math.min(1, LABEL_FIT_CHARS / name.length));

  return (
    <CompCanvas className="bg-[#1a1138]">
      {active && (
        <div
          className="absolute inset-0 font-['Hanken_Grotesk'] text-[#fff]"
          style={{ backgroundImage: "linear-gradient(180deg, #1a1138 42.007%, #35707b 106.98%)" }}
        >
          {LIGHT_RECTANGLES.map((rect, i) => (
            <div
              key={`light-${rect.x}-${rect.y}`}
              className="absolute bg-[#35707b]"
              style={{
                left: rect.x,
                top: rect.y,
                width: rect.w,
                height: rect.h,
                ...enter(
                  i % 2 ? "wrapped-slide-right" : "wrapped-slide-left",
                  TIMING.rectangles + i * 60,
                ),
              }}
            />
          ))}
          {DARK_RECTANGLES.map((rect, i) => (
            <div
              key={`dark-${rect.x}-${rect.y}`}
              className="absolute bg-[#1a1138]"
              style={{
                left: rect.x,
                top: rect.y,
                width: rect.w,
                height: rect.h,
                ...enter(
                  i % 2 ? "wrapped-slide-left" : "wrapped-slide-right",
                  TIMING.rectangles + i * 60,
                ),
              }}
            />
          ))}

          <div className="absolute inset-0" style={enter("wrapped-pop", TIMING.window, 900)}>
            <img
              alt=""
              src={`${ASSETS}/window-frame.svg`}
              className="absolute top-[596.4px] left-[33.43px] h-[726px] w-[1015.001px] max-w-none"
            />
            <SpaceView />
          </div>

          {article && (
            <p
              className="absolute top-[215px] left-[197px] font-bold text-[80px] leading-normal"
              style={enter("wrapped-rise", TIMING.label)}
            >
              {article}
            </p>
          )}
          <p
            className="-translate-x-1/2 absolute top-[295px] left-1/2 whitespace-nowrap text-center font-black leading-normal"
            style={{ fontSize: labelSize, ...enter("wrapped-rise", TIMING.label + 150) }}
          >
            {name}
          </p>

          <p
            className="absolute top-[1376px] left-[84px] w-[912px] font-semibold text-[40px] leading-normal"
            style={enter("wrapped-fade", TIMING.description, 900)}
          >
            {description}
          </p>

          <img
            alt="nwPlus"
            src={`${ASSETS}/nwplus-logo.svg`}
            className="absolute top-[1777px] left-[504px] h-[100px] w-[72.7px] max-w-none"
          />
        </div>
      )}
    </CompCanvas>
  );
}

/** Everything seen through the window, clipped to its hexagon. */
function SpaceView() {
  const at = (x: number, y: number) => ({ left: x - WINDOW.x, top: y - WINDOW.y });

  return (
    <div
      className="absolute overflow-hidden"
      style={{
        left: WINDOW.x,
        top: WINDOW.y,
        width: WINDOW.width,
        height: WINDOW.height,
        clipPath: WINDOW_CLIP,
      }}
    >
      <img
        alt=""
        src={`${ASSETS}/space-fill.svg`}
        className="absolute inset-0 size-full max-w-none"
      />
      <img
        alt=""
        src={`${ASSETS}/asteroid-belt.svg`}
        className="wrapped-bob absolute h-[970px] w-[1192.5px] max-w-none mix-blend-hard-light"
        style={at(43, 490)}
      />
      <div
        className="absolute flex h-[201.064px] w-[195.381px] items-center justify-center"
        style={at(163, 674)}
      >
        <div className="-scale-y-100 flex-none rotate-[129.06deg]">
          <img
            alt=""
            src={`${ASSETS}/saturn.svg`}
            className="block h-[121.512px] w-[160.331px] max-w-none"
          />
        </div>
      </div>
      <img
        alt=""
        src={`${ASSETS}/stars.svg`}
        className="wrapped-twinkle absolute h-[998px] w-[914px] max-w-none"
        style={at(18, 201)}
      />
      <div className="absolute h-[726px] w-[963px]" style={at(59, 596)}>
        <img
          alt=""
          src={`${ASSETS}/window-condensation.svg`}
          className="absolute inset-[-10.18%_-7.67%] block size-full max-w-none"
        />
      </div>
      <div className="absolute h-[970px] w-[1192.5px] mix-blend-hard-light" style={at(43, 490)}>
        <img
          alt=""
          src={`${ASSETS}/asteroid-belt-front.svg`}
          className="absolute inset-[-2.03%_-1.65%] block size-full max-w-none"
        />
      </div>
      <FlowingIcon at={at} />
      {WINDOW_SPARKS.map((spark) => (
        <img
          key={`${spark.src}-${spark.x}-${spark.y}`}
          alt=""
          src={`${ASSETS}/${spark.src}.svg`}
          className={`wrapped-twinkle absolute max-w-none ${"overlay" in spark ? "mix-blend-overlay" : ""}`}
          style={{ ...at(spark.x, spark.y), width: spark.w, height: spark.h }}
        />
      ))}
    </div>
  );
}

/** The ringed planet: back ring, planet, then the front ring clipped to sit across it. */
function FlowingIcon({ at }: { at: (x: number, y: number) => CSSProperties }) {
  return (
    <div
      className="absolute inset-0"
      style={{ animation: `wrapped-flow-by ${ICON_FLOW_MS}ms linear ${TIMING.icon}ms both` }}
    >
      <div
        className="absolute flex h-[635.566px] w-[635.569px] items-center justify-center"
        style={at(1071.96, 642.89)}
      >
        <div className="relative h-[374.6px] w-[524.228px] flex-none rotate-45">
          <img
            alt=""
            src={`${ASSETS}/icon-back.svg`}
            className="absolute inset-[0_-0.5%] block size-full max-w-none"
          />
        </div>
      </div>
      <div
        className="absolute flex size-[431.316px] items-center justify-center"
        style={at(1167.91, 739.08)}
      >
        <img
          alt=""
          src={`${ASSETS}/icon-middle.svg`}
          className="-scale-y-100 block size-[332.443px] max-w-none flex-none rotate-[111.55deg]"
        />
      </div>
      {/* Figma's nested mask for the front ring does not survive CSS masking, so the
          ring's near half (below its major axis) is clipped instead to pass over the planet. */}
      <div
        className="absolute flex h-[635.566px] w-[635.569px] items-center justify-center"
        style={{
          ...at(1071.95, 642.89),
          clipPath: "polygon(0% 39.54%, 100% 60.2%, 100% 100%, 0% 100%)",
        }}
      >
        <div className="relative h-[374.6px] w-[524.228px] flex-none rotate-45">
          <img
            alt=""
            src={`${ASSETS}/icon-front.svg`}
            className="absolute inset-[0_-0.5%] block size-full max-w-none"
          />
        </div>
      </div>
    </div>
  );
}
