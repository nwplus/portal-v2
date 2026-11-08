import { ArchetypeIcon, archetypeIconCentre } from "@/components/features/wrapped/archetype-icons";
import { CompCanvas } from "@/components/features/wrapped/comp-canvas";
import type { ArchetypeId } from "@/lib/firebase/types/wrapped";
import { archetypeCopy } from "@/lib/wrapped/archetype-copy";
import type { CSSProperties, ReactNode } from "react";

/**
 * The archetype reveal: the hacker's archetype over a ship's hexagonal window onto space.
 *
 * Built from the "(Animation) Overall Archetype" frame in Figma's Hacker Wrapped "Final
 * Handoff" section, laid out in comp pixels. The archetype's icon pops in where its
 * static "Overall Archetype - ___" frame has it and rocks there: the prizewinner's ringed
 * planet drawn below, every other icon from `archetype-icons.tsx`.
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
/** One swing of the icon's rock, side to side. */
const ICON_ROCK_MS = 3500;

/**
 * The planet's parts are placed as in the animated Figma frame, which starts it off-canvas
 * to fly past; this moves it onto the static frame's spot, its body centred on `PLANET_CENTRE`.
 */
const PLANET_SHIFT_X = -862.07;
const PLANET_CENTRE = { x: 521.5, y: 952.5 } as const;

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

/**
 * Small stars and dust inside the window, in comp coordinates. The dust dots were overlay
 * blends; they're baked with that blend applied, a pixel of margin around each.
 */
const WINDOW_SPARKS = [
  { src: "star-a.svg", x: 776, y: 1165, w: 26, h: 29 },
  { src: "star-a.svg", x: 230, y: 1062, w: 26, h: 29 },
  { src: "star-b.svg", x: 651, y: 705, w: 14, h: 16 },
  { src: "star-c.svg", x: 364, y: 758, w: 22, h: 25 },
  { src: "star-d.svg", x: 885, y: 823, w: 35, h: 40 },
  { src: "dot-a.webp", x: 649, y: 1168, w: 19, h: 19 },
  { src: "dot-b.webp", x: 309, y: 678, w: 10, h: 10 },
  { src: "dot-c.webp", x: 611, y: 880, w: 14, h: 14 },
  { src: "dot-d.webp", x: 246, y: 1152, w: 19, h: 19 },
  { src: "dot-e.webp", x: 909, y: 995, w: 24, h: 24 },
] as const;

function enter(name: string, delay: number, duration = 800): CSSProperties {
  return { animation: `${name} ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms both` };
}

/** Splits "The Prizewinner" into its article and name. */
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
            <SpaceView archetype={archetype} />
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

/**
 * Everything seen through the window, clipped to its hexagon.
 *
 * The asteroid belt's back and front layers, the condensation, and the dust were hard-light
 * and overlay blends; they're baked into images with the blends applied (against the scene
 * mid-bob and mid-twinkle), since live blends under these animations were repainted on the
 * CPU every frame and could crash iOS Safari. The back layer still bobs.
 */
function SpaceView({ archetype }: { archetype: ArchetypeId }) {
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
        src={`${ASSETS}/asteroid-belt-back.webp`}
        className="wrapped-bob absolute top-0 left-0 h-[667px] w-[913px] max-w-none"
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
      <img
        alt=""
        src={`${ASSETS}/asteroid-belt-front.webp`}
        className="absolute top-0 left-0 h-[667px] w-[913px] max-w-none"
      />
      <IconStage
        centre={archetype === "THE_PRIZEWINNER" ? PLANET_CENTRE : archetypeIconCentre(archetype)}
      >
        {archetype === "THE_PRIZEWINNER" ? <PlanetIcon /> : <ArchetypeIcon archetype={archetype} />}
      </IconStage>
      {WINDOW_SPARKS.map((spark) => (
        <img
          key={`${spark.src}-${spark.x}-${spark.y}`}
          alt=""
          src={`${ASSETS}/${spark.src}`}
          className="wrapped-twinkle absolute max-w-none"
          style={{ ...at(spark.x, spark.y), width: spark.w, height: spark.h }}
        />
      ))}
    </div>
  );
}

/**
 * A comp-sized layer the icon is drawn in, in comp coordinates. It pops in, then rocks
 * slowly about the icon's centre for as long as the slide is up.
 *
 * The rock runs `alternate` from a negative half-swing delay, so at time 0 it is mid-swing
 * and upright.
 */
function IconStage({
  centre,
  children,
}: { centre: { x: number; y: number }; children: ReactNode }) {
  return (
    <div
      className="absolute h-[1920px] w-[1080px]"
      style={{
        left: -WINDOW.x,
        top: -WINDOW.y,
        transformOrigin: `${centre.x}px ${centre.y}px`,
        animation: [
          `wrapped-pop 900ms cubic-bezier(0.22, 1, 0.36, 1) ${TIMING.icon}ms both`,
          `wrapped-rock ${ICON_ROCK_MS}ms ease-in-out ${-ICON_ROCK_MS / 2}ms infinite alternate`,
        ].join(", "),
      }}
    >
      {children}
    </div>
  );
}

/** The ringed planet: back ring, planet, then the front ring clipped to sit across it. */
function PlanetIcon() {
  const at = (x: number, y: number): CSSProperties => ({ left: x + PLANET_SHIFT_X, top: y });
  return (
    <>
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
    </>
  );
}
