import type { ArchetypeId } from "@/lib/firebase/types/wrapped";
import { type CSSProperties, type ReactNode, useId } from "react";

/**
 * Each archetype's icon (except the prizewinner's ringed planet, which `archetype-slide`
 * draws in parts), laid out in comp pixels where it sits in its "Overall Archetype - ___"
 * frame on Figma's "07/17/2026 Final" page.
 *
 * Figma exports each icon unrotated, so the frames' rotations are applied here: a box at
 * the icon's rotated bounds, with the icon centred in it and turned.
 */

const ASSETS = "/assets/wrapped/archetype/icons";

type IconSpec = {
  /** The rotated icon's bounds in the comp. */
  box: { x: number; y: number; w: number; h: number };
  /** The exported SVG and its own (unrotated) size. */
  src: string;
  size: { w: number; h: number };
  rotate: number;
};

const ICONS: Partial<Record<ArchetypeId, IconSpec>> = {
  THE_VETERAN: {
    box: { x: 299.84, y: 719.85, w: 480.307, h: 480.307 },
    src: "veteran.svg",
    size: { w: 400, h: 400 },
    rotate: 13.11,
  },
  ANCHOR: {
    box: { x: 324.05, y: 739.15, w: 432.392, h: 441.71 },
    src: "anchor.svg",
    size: { w: 334.687, h: 350 },
    rotate: 19.52,
  },
  // The export includes the badge's outer glow, so it overhangs its 300px frame.
  THE_LONE_WOLF: {
    box: { x: 390, y: 810, w: 300, h: 300 },
    src: "lone-wolf.svg",
    size: { w: 340.179, h: 340.179 },
    rotate: 0,
  },
  THE_SPEEDRUNNER: {
    box: { x: 313.69, y: 737.5, w: 435.974, h: 429.54 },
    src: "speedrunner.svg",
    size: { w: 359.011, h: 350 },
    rotate: 14.68,
  },
  THE_EARLY_BIRD: {
    box: { x: 300.15, y: 785, w: 478.873, h: 350 },
    src: "early-bird.svg",
    size: { w: 478.873, h: 350 },
    rotate: 0,
  },
  THE_FINISHER: {
    box: { x: 344.36, y: 757.62, w: 390.832, h: 404.889 },
    src: "finisher.svg",
    size: { w: 332.436, h: 350.001 },
    rotate: 10.54,
  },
  THE_NIGHT_OWL: {
    box: { x: 344.6, y: 788.82, w: 391.477, h: 342.361 },
    src: "night-owl.svg",
    size: { w: 356.67, h: 299.999 },
    rotate: -7.2,
  },
  THE_ORIGIN_STORY: {
    box: { x: 379.26, y: 739.74, w: 322.122, h: 439.981 },
    src: "origin-story.svg",
    size: { w: 251.902, h: 400 },
    rotate: 10.76,
  },
};

/**
 * The icon for `archetype`, positioned in comp coordinates; render it inside a layer
 * that spans the comp. Null for the prizewinner, whose planet is drawn separately.
 */
export function ArchetypeIcon({ archetype }: { archetype: ArchetypeId }): ReactNode {
  if (archetype === "THE_WARRIOR") return <WarriorIcon />;
  if (archetype === "THE_REGULAR") return <RegularIcon />;
  const spec = ICONS[archetype];
  return spec ? <RotatedIcon spec={spec} /> : null;
}

/** The point the icon rocks about: its centre in the comp. */
export function archetypeIconCentre(archetype: ArchetypeId): { x: number; y: number } {
  if (archetype === "THE_WARRIOR") return { x: 522.84, y: 955.9 };
  if (archetype === "THE_REGULAR") return { x: 540.14, y: 960 };
  const box = ICONS[archetype]?.box;
  return box ? { x: box.x + box.w / 2, y: box.y + box.h / 2 } : { x: 540, y: 960 };
}

function RotatedIcon({ spec }: { spec: IconSpec }) {
  const { box, src, size, rotate } = spec;
  return (
    <div
      className="absolute flex items-center justify-center"
      style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
    >
      <img
        alt=""
        src={`${ASSETS}/${src}`}
        className="block max-w-none flex-none"
        style={{ width: size.w, height: size.h, transform: `rotate(${rotate}deg)` }}
      />
    </div>
  );
}

/** Two crossed swords behind a shield. */
function WarriorIcon() {
  return (
    <>
      <div className="absolute top-[712.14px] left-[437.97px] flex h-[487.513px] w-[238.014px] items-center justify-center">
        <img
          alt=""
          src={`${ASSETS}/warrior/sword-a.svg`}
          className="block h-[469.572px] w-[132.523px] max-w-none flex-none rotate-[13.44deg]"
        />
      </div>
      <div className="absolute top-[744.54px] left-[317.78px] flex h-[439.72px] w-[410.129px] items-center justify-center">
        <img
          alt=""
          src={`${ASSETS}/warrior/sword-b.svg`}
          className="-scale-y-100 block h-[469.572px] w-[132.523px] max-w-none flex-none rotate-[138.56deg]"
        />
      </div>
      <div className="absolute top-[821.27px] left-[392.75px] flex h-[344.246px] w-[310.843px] items-center justify-center">
        <img
          alt=""
          src={`${ASSETS}/warrior/shield.svg`}
          className="-rotate-14 block h-[293.129px] w-[247.267px] max-w-none flex-none"
        />
      </div>
    </>
  );
}

const REGULAR = `${ASSETS}/regular`;
/**
 * The galaxy seen through the visor is masked twice in Figma (nested mask groups): by the
 * visor's ellipse and by a radial falloff. Nested masks intersect, so every layer using
 * this pair sets `mask-composite: intersect` — CSS would otherwise add them.
 */
const VISOR_MASK = `url("${REGULAR}/ellipse-90.svg"), url("${REGULAR}/ellipse-91.svg")`;
const VISOR_EDGE = `url("${REGULAR}/ellipse-90.svg")`;

/** Sparkles reflected in the visor, color-dodged and clipped to its inner ellipse. */
const REGULAR_SPARKLES = [
  { src: "star-8", x: 529.44, y: 907.13, w: 14.269, h: 15.108, mx: -164.09, my: -60.013 },
  { src: "star-9", x: 470.27, y: 956.65, w: 10.072, h: 10.492, mx: -104.914, my: -109.532 },
  { src: "star-9", x: 621.77, y: 980.56, w: 10.072, h: 10.492, mx: -256.418, my: -133.451 },
  { src: "star-11", x: 473.21, y: 988.96, w: 9.233, h: 9.652, mx: -107.855, my: -141.846 },
  { src: "star-11", x: 581.48, y: 896.63, w: 9.233, h: 9.652, mx: -216.129, my: -49.52 },
  { src: "star-10", x: 586.09, y: 1035.96, w: 12.59, h: 13.01, mx: -220.742, my: -188.846 },
  { src: "ellipse-71", x: 590.71, y: 982.25, w: 4.197, h: 4.197, mx: -225.363, my: -135.133 },
  { src: "ellipse-161", x: 441.73, y: 990.64, w: 9.652, h: 9.652, mx: -76.383, my: -143.523 },
  { src: "ellipse-162", x: 517.69, y: 882.78, w: 5.036, h: 5.036, mx: -152.34, my: -35.67 },
  { src: "ellipse-162", x: 401.86, y: 907.96, w: 5.036, h: 5.036, mx: -36.512, my: -60.85 },
  { src: "ellipse-164", x: 552.11, y: 1001.55, w: 2.938, h: 2.938, mx: -186.754, my: -154.438 },
  { src: "ellipse-165", x: 569.73, y: 1039.32, w: 1.679, h: 1.679, mx: -204.379, my: -192.203 },
] as const;

/** An astronaut helmet with a green galaxy and a ringed planet in its visor. */
function RegularIcon() {
  return (
    <>
      <img
        alt=""
        src={`${REGULAR}/union.svg`}
        className="absolute top-[785px] left-[342.27px] block h-[350px] w-[395.744px] max-w-none"
      />
      <img
        alt=""
        src={`${REGULAR}/mask-group.svg`}
        className="absolute top-[785px] left-[342.27px] block h-[350px] w-[395.744px] max-w-none"
      />
      <img
        alt=""
        src={`${REGULAR}/ellipse-158.svg`}
        className="absolute top-[847.11px] left-[365.35px] block h-[225.36px] w-[350px] max-w-none"
      />
      <div className="absolute top-[865.28px] left-[401.86px] flex h-[45.315px] w-[89.388px] items-center justify-center">
        <img
          alt=""
          src={`${REGULAR}/ellipse-159.svg`}
          className="block h-[16.775px] w-[88.858px] max-w-none flex-none rotate-[-19.38deg]"
        />
      </div>

      {/* The green galaxy seen through the visor. */}
      <div className="absolute top-[814.54px] left-[445.49px] flex size-[237.682px] items-center justify-center">
        <div
          className="-scale-y-100 mask-position-[-80.138px_32.575px,_-18.633px_14.984px] mask-size-[350px_225.36px,_278.366px_244.82px] mask-intersect mask-no-repeat relative size-[237.682px] flex-none rotate-180"
          style={{ maskImage: VISOR_MASK }}
        >
          <img
            alt=""
            src={`${REGULAR}/ellipse-92.svg`}
            className="absolute inset-0 block size-full max-w-none"
          />
        </div>
      </div>
      <div className="absolute top-[762px] left-[318.26px] flex h-[378.6px] w-[472.498px] items-center justify-center mix-blend-overlay">
        <div
          className="-scale-y-100 mask-position-[47.092px_85.117px,_108.597px_67.526px] mask-size-[350px_225.36px,_278.366px_244.82px] mask-intersect mask-no-repeat relative h-[300.969px] w-[421.119px] flex-none rotate-[-168.55deg]"
          style={{ maskImage: VISOR_MASK }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-size-[56.235px_56.235px] bg-top-left opacity-50"
            style={{ backgroundImage: `url("${REGULAR}/noise.png")` }}
          />
        </div>
      </div>
      <div className="absolute top-[879.99px] left-[593.12px] flex h-[23.537px] w-[16.839px] items-center justify-center">
        <div
          className="-scale-y-100 mask-position-[-227.766px_-32.879px,_-166.261px_-50.469px] mask-size-[350px_225.36px,_278.366px_244.82px] mask-intersect mask-no-repeat relative h-[21.413px] w-[12.842px] flex-none rotate-[-168.55deg]"
          style={{ maskImage: VISOR_MASK }}
        >
          <div className="absolute inset-[0_-19.78%_-15.17%_-25.3%]">
            <img alt="" src={`${REGULAR}/group-190.svg`} className="block size-full max-w-none" />
          </div>
        </div>
      </div>
      <RegularPlanet />
      <div className="absolute top-[887.07px] left-[559.65px] flex h-[89.59px] w-[87.915px] items-center justify-center">
        {/* Its one visible dot is color-dodged; the blend is set here so it reaches the visor. */}
        <div
          className="-scale-y-100 mask-position-[-194.297px_-39.959px,_-132.792px_-57.55px] mask-size-[350px_225.36px,_278.366px_244.82px] mask-intersect mask-no-repeat relative h-[76.371px] w-[74.228px] flex-none rotate-[-168.55deg] mix-blend-color-dodge"
          style={{ maskImage: VISOR_MASK }}
        >
          <img
            alt=""
            src={`${REGULAR}/group-187.svg`}
            className="absolute inset-0 block size-full max-w-none"
          />
        </div>
      </div>

      {/* The visor's glare and reflected sparkles. */}
      <div
        className="mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-29.801px_-38.818px] mask-size-[350px_225.36px] absolute top-[885.93px] left-[395.15px] h-[221.793px] w-[424.49px]"
        style={{ maskImage: VISOR_EDGE }}
      >
        <img
          alt=""
          src={`${REGULAR}/vector-2645.svg`}
          className="absolute inset-0 block size-full max-w-none"
        />
      </div>
      {REGULAR_SPARKLES.map((s) => (
        <div
          key={`${s.src}-${s.x}-${s.y}`}
          className="mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-size-[350px_225.36px] absolute mix-blend-color-dodge"
          style={{
            left: s.x,
            top: s.y,
            width: s.w,
            height: s.h,
            maskImage: VISOR_EDGE,
            maskPosition: `${s.mx}px ${s.my}px`,
          }}
        >
          <img
            alt=""
            src={`${REGULAR}/${s.src}.svg`}
            className="absolute inset-0 block size-full max-w-none"
          />
        </div>
      ))}
    </>
  );
}

/**
 * The ringed planet in the visor (Figma "Group 144"), drawn inline rather than as an
 * `<img>`: its ring, body and shine use color-dodge, hard-light and overlay against the
 * visor, and an SVG loaded as an image only blends within itself. Each layer is masked,
 * turned and blended on its own, since any shared wrapper would isolate the blends.
 */
function RegularPlanet() {
  const id = useId();
  const layer: CSSProperties = {
    left: (158.953 - 130.439) / 2,
    top: (163.577 - 98.856) / 2,
    width: 130.439,
    height: 98.856,
    transform: "rotate(50.94deg)",
    maskImage: VISOR_MASK,
    maskPosition: "-194.881px -13.235px, -133.377px -30.826px",
    maskSize: "350px 225.36px, 278.366px 244.82px",
    maskComposite: "intersect",
    maskRepeat: "no-repeat",
  };
  const svg = (blend: CSSProperties["mixBlendMode"], body: ReactNode) => (
    <svg
      aria-hidden
      viewBox="0 0 130.439 98.8564"
      fill="none"
      preserveAspectRatio="none"
      overflow="visible"
      className="absolute block"
      style={{ ...layer, mixBlendMode: blend }}
    >
      {body}
    </svg>
  );

  return (
    <div className="absolute top-[860.35px] left-[560.23px] h-[163.577px] w-[158.953px]">
      {svg(
        "color-dodge",
        <>
          <path
            d="M100.292 33.1704C115.963 28.0373 127.262 26.1375 129.856 28.7822C134.511 33.5307 109.347 51.1273 73.6493 68.0856C37.952 85.0438 5.23949 94.9421 0.583262 90.1942C-1.81115 87.7521 3.68207 81.9108 14.4394 74.5064L16.1446 76.4212C8.4237 81.797 4.55929 85.8607 6.19569 87.5257C9.83039 91.2232 39.2191 81.6895 71.837 66.2321C104.455 50.7746 127.95 35.2461 124.317 31.5482C122.502 29.703 114.272 31.1534 102.428 34.9914L100.292 33.1704Z"
            fill={`url(#${id}-ring)`}
          />
          <defs>
            <linearGradient
              id={`${id}-ring`}
              x1="69.4578"
              y1="63.3373"
              x2="75.9168"
              y2="72.3233"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#716A84" />
              <stop offset="0.927083" stopColor="#F378EE" />
            </linearGradient>
          </defs>
        </>,
      )}
      {svg(
        "hard-light",
        <>
          <circle
            cx="56.0376"
            cy="49.4263"
            r="49.1209"
            fill={`url(#${id}-body)`}
            fillOpacity="0.55"
          />
          <defs>
            <linearGradient
              id={`${id}-body`}
              x1="22.8986"
              y1="9.26164"
              x2="84.3585"
              y2="91.0515"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#F378EE" />
              <stop offset="1" stopColor="#E0B2F0" stopOpacity="0" />
            </linearGradient>
          </defs>
        </>,
      )}
      {svg(
        "overlay",
        <>
          <path
            d="M56.0372 0C83.3357 0.000209468 105.465 22.1302 105.465 49.4287C105.465 76.727 83.3355 98.8562 56.0372 98.8564C28.7388 98.8564 6.60873 76.7271 6.60854 49.4287C6.60854 22.1301 28.7386 0 56.0372 0Z"
            fill={`url(#${id}-shine)`}
          />
          <defs>
            <linearGradient
              id={`${id}-shine`}
              x1="20.6258"
              y1="7.77381"
              x2="83.2232"
              y2="92.7479"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="white" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
        </>,
      )}
    </div>
  );
}
