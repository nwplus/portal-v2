import type { ArchetypeId } from "@/lib/firebase/types/wrapped";
import type { ReactNode } from "react";

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

/**
 * An astronaut helmet with a green galaxy and a ringed planet in its visor. Its layers are
 * masked to the visor and blended (color-dodge, hard-light, overlay) against it, so it's
 * baked into one image from those coded layers: live, the masks and blends were repainted
 * on the CPU as the icon rocks. The blends only ever reached the visor, so the image is
 * exact.
 */
function RegularIcon() {
  return (
    <img
      alt=""
      src={`${ASSETS}/regular.webp`}
      className="absolute top-[785px] left-[342px] block h-[350px] w-[396px] max-w-none"
    />
  );
}
