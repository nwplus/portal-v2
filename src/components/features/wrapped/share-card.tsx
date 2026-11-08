import { ArchetypeIcon, archetypeIconCentre } from "@/components/features/wrapped/archetype-icons";
import { CompCanvas } from "@/components/features/wrapped/comp-canvas";
import { cn } from "@/lib/utils";
import { PROJECT_NAME_WIDTH, type ShareCardData, projectNameFit } from "@/lib/wrapped/share-card";
import type { CSSProperties } from "react";

/**
 * The shareable "Hacker Wrapped" image: one still 1080x1920 card summing up the hacker's
 * event, saved from the summary's share sheet.
 *
 * Built from the "Summary Slide" frame (3273:422) in Figma's Hacker Wrapped "For Portal"
 * file, laid out in comp pixels. It never plays in the deck — it is only mounted
 * offscreen and rasterised — so nothing here animates.
 *
 * The frame's mesh-gradient backdrop is a Figma shader; it is drawn from its baked
 * render, `summary/background.png`, which the summary slide shares.
 *
 * Line heights are set to the frame's text boxes rather than left `normal`: Figma's HK
 * Grotesk sets lines at 1.3x, Hanken Grotesk's `normal` is nearer 1.5x. Its two
 * figure-over-label blocks are tighter still (179px for the 160px figure, 123px for 108px).
 *
 * The frame's glows are blurred green silhouettes of what they sit behind. The code
 * column's is static art, so it stays an SVG; the lines figure and archetype icon change
 * per hacker, so theirs are drawn from the live text and icon instead.
 */

const ASSETS = "/assets/wrapped/share";
const BACKGROUND = "/assets/wrapped/summary/background.png";

/** Where the archetype icon sits: the centre of the frame's prizewinner icon. */
const ARCHETYPE_SLOT = { x: 318, y: 1028 } as const;
/**
 * The archetype slide's icons, drawn for its window, shrink by this to fit the slot —
 * the ratio of the card's prizewinner badge (253.29) to the slide's (332.443).
 */
const ARCHETYPE_ICON_SCALE = 0.76;

/** The frame's glow: its silhouettes' fill, and their blur (a Gaussian standard deviation). */
const GLOW_COLOUR = "#20ffaf";
const ICON_GLOW_BLUR = 15;
const LINES_GLOW_BLUR = 12.5;
const ICON_GLOW_FILTER_ID = "wrapped-share-icon-glow";

/** The lines-shipped figure is drawn this size up to 5 characters ("5,000"), then shrinks. */
const LINES_FONT_PX = 160;
const LINES_FIT_CHARS = 5;

export function ShareCard({ data }: { data: ShareCardData }) {
  return (
    <CompCanvas className="bg-[#2c2543]">
      <div className="absolute inset-0 font-['Hanken_Grotesk'] text-[#c5fffb]">
        <img alt="" src={BACKGROUND} className="absolute inset-0 size-full max-w-none" />
        <Rocket />

        <Glow src="code-glow" box={[572, 491, 384, 1101.5]} inset="-2.72% -7.81%" />
        {data.archetype === "THE_PRIZEWINNER" ? (
          <Glow src="archetype-glow" box={[110, 889, 409.775, 282.192]} inset="-10.63% -7.32%" />
        ) : (
          <SlotIconGlow archetype={data.archetype} />
        )}
        <LinesGlow value={data.linesShipped} />

        <Stampbook count={data.stampCount} label={data.stampsLabel} />
        <HackathonPlanet number={data.hackathonNumber} suffix={data.hackathonSuffix} />
        <Archetype data={data} />
        <LinesShipped value={data.linesShipped} label={data.linesLabel} />
        <ProjectWindow name={data.projectName} />

        <img
          alt=""
          src={`${ASSETS}/stars.svg`}
          className="absolute top-[288px] left-[64px] h-[1460px] w-[976px] max-w-none"
        />

        <p className="-translate-x-1/2 absolute top-[141px] left-1/2 w-[800px] text-center font-extrabold text-[96px] leading-[1.3]">
          <span className="block font-black text-[#20ffaf]">{data.event}</span>
          <span className="block">Hacker Wrapped</span>
        </p>
      </div>
    </CompCanvas>
  );
}

/** Rocket parts: [asset, box x, y, w, h, image w, h, image transform]. */
const ROCKET: [string, number, number, number, number, number, number, string][] = [
  ["rocket-flame-small", 80.25, 1826.38, 156.076, 115.194, 142.716, 59.803, "rotate(25deg)"],
  ["rocket-flame-large", 58.03, 1783.46, 226.897, 148.218, 219.921, 59.803, "rotate(25deg)"],
  ["rocket-fin-left", -28.14, 1606.01, 208.088, 250.169, 128.916, 215.917, "rotate(25deg)"],
  [
    "rocket-fin-right",
    225.03,
    1719.66,
    208.088,
    250.169,
    128.916,
    215.917,
    "rotate(-155deg) scaleY(-1)",
  ],
  ["rocket-nose", 259.13, 1379.76, 179.286, 184.772, 131.304, 142.645, "rotate(25deg)"],
  ["rocket-body", 67.61, 1436.95, 382.687, 464.882, 233.925, 403.86, "rotate(25deg)"],
  ["rocket-window", 176.05, 1560.45, 186.13, 186.129, 148.06, 148.06, "rotate(25deg)"],
  ["rocket-porthole-shine", 142.15, 1722.48, 104.009, 167.261, 36.679, 167.448, "rotate(25deg)"],
];

/** The rocket in the bottom-left corner, each part turned inside its Figma bounds. */
function Rocket() {
  return (
    <>
      {ROCKET.map(([src, left, top, width, height, w, h, transform]) => (
        <div
          key={src}
          className="absolute flex items-center justify-center"
          style={{ left, top, width, height }}
        >
          <img
            alt=""
            src={`${ASSETS}/${src}.svg`}
            className="block max-w-none flex-none"
            style={{ width: w, height: h, transform }}
          />
        </div>
      ))}
    </>
  );
}

/** A centred caption, at its Figma centre-x and top. */
function Caption({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <p
      className="-translate-x-1/2 absolute whitespace-nowrap text-center font-semibold text-[48px] leading-[1.3]"
      style={{ left: x, top: y }}
    >
      {children}
    </p>
  );
}

/** A colour-dodged glow; `inset` lets the SVG's blur overhang its Figma box. */
function Glow({
  src,
  box: [left, top, width, height],
  inset,
}: {
  src: string;
  box: [number, number, number, number];
  inset: string;
}) {
  return (
    <div className="absolute mix-blend-color-dodge" style={{ left, top, width, height }}>
      <div className="absolute" style={{ inset }}>
        <img alt="" src={`${ASSETS}/${src}.svg`} className="block size-full max-w-none" />
      </div>
    </div>
  );
}

/** Long figures shrink to keep clear of the code window: "128,456" at 133px. */
function linesFontSize(value: string) {
  return value.length > LINES_FIT_CHARS
    ? Math.floor((LINES_FONT_PX * LINES_FIT_CHARS) / value.length)
    : LINES_FONT_PX;
}

/** The figure on its 179px line. A shrunk one stays on the line's baseline, so the label never moves. */
function LinesFigure({ value }: { value: string }) {
  return (
    <p
      className="whitespace-nowrap font-black text-[#20ffaf] leading-[179px]"
      style={{ fontSize: LINES_FONT_PX }}
    >
      <span style={{ fontSize: linesFontSize(value) }}>{value}</span>
    </p>
  );
}

const LINES_BLOCK =
  "-translate-x-1/2 absolute top-[473px] left-[309px] w-[400px] text-center font-bold leading-[1.3]";

function LinesShipped({ value, label }: { value: string; label: string }) {
  return (
    <div className={LINES_BLOCK}>
      <LinesFigure value={value} />
      <p className="text-[64px]">{label}</p>
    </div>
  );
}

/** The figure's glow: a blurred copy of it, dodged into the backdrop. */
function LinesGlow({ value }: { value: string }) {
  return (
    <div
      aria-hidden
      className={`${LINES_BLOCK} opacity-50 mix-blend-color-dodge`}
      style={{ filter: `blur(${LINES_GLOW_BLUR}px)` }}
    >
      <LinesFigure value={value} />
    </div>
  );
}

function ProjectWindow({ name }: { name: string }) {
  const fit = projectNameFit(name);
  return (
    <>
      <div
        className="absolute top-[491px] left-[584px] h-[260px] w-[372px] rounded-[8px]"
        style={{
          backgroundImage:
            "linear-gradient(-73.15deg, rgb(158, 138, 208) 4.03%, rgb(105, 80, 174) 95.9%)",
        }}
      />
      <img
        alt=""
        src={`${ASSETS}/ide-windows.svg`}
        className="absolute top-[533px] left-[598px] h-[204px] w-[344px] max-w-none mix-blend-multiply"
      />
      <img
        alt=""
        src={`${ASSETS}/ide-details.svg`}
        className="absolute top-[534px] left-[598px] h-[185px] w-[323px] max-w-none"
      />
      <div className="absolute top-[491px] left-[584px] h-[28px] w-[372px] rounded-t-[8px] bg-gradient-to-r from-[#a493d0] to-[#e2d6ff]" />
      <img
        alt=""
        src={`${ASSETS}/ide-status-bars.svg`}
        className="absolute top-[499px] left-[595px] h-[12px] w-[52px] max-w-none"
      />
      {/* Wider than the window so short names sit on one line; long ones wrap, then shrink. */}
      <p
        className={cn(
          "-translate-x-1/2 absolute top-[770px] left-[770px] break-words text-center font-semibold leading-[1.3]",
          fit.lines === 3 ? "line-clamp-3" : "line-clamp-2",
        )}
        style={{ fontSize: fit.size, width: PROJECT_NAME_WIDTH }}
      >
        {name}
      </p>
    </>
  );
}

function Archetype({ data }: { data: ShareCardData }) {
  return (
    <>
      {data.archetype === "THE_PRIZEWINNER" ? (
        <PrizewinnerIcon />
      ) : (
        <SlotIcon archetype={data.archetype} />
      )}
      <Caption x={332} y={1238}>
        {data.archetypeLabel}
      </Caption>
    </>
  );
}

/**
 * Any other archetype's icon, as the archetype slide draws it, shrunk about its centre
 * and moved onto the slot.
 */
function SlotIcon({ archetype }: { archetype: ShareCardData["archetype"] }) {
  const centre = archetypeIconCentre(archetype);
  return (
    <div
      className="absolute top-0 left-0 h-[1920px] w-[1080px]"
      style={{
        transformOrigin: `${centre.x}px ${centre.y}px`,
        transform: `translate(${ARCHETYPE_SLOT.x - centre.x}px, ${ARCHETYPE_SLOT.y - centre.y}px) scale(${ARCHETYPE_ICON_SCALE})`,
      }}
    >
      <ArchetypeIcon archetype={archetype} />
    </div>
  );
}

/**
 * An icon's glow: its silhouette, filled green and blurred by an SVG filter (CSS has no
 * "fill with a colour"), dodged into the backdrop as the frame's prizewinner glow is.
 */
function SlotIconGlow({ archetype }: { archetype: ShareCardData["archetype"] }) {
  return (
    <>
      <svg aria-hidden className="absolute size-0">
        <defs>
          <filter
            id={ICON_GLOW_FILTER_ID}
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodColor={GLOW_COLOUR} />
            <feComposite in2="SourceAlpha" operator="in" />
            <feGaussianBlur stdDeviation={ICON_GLOW_BLUR} />
          </filter>
        </defs>
      </svg>
      <div
        aria-hidden
        className="absolute inset-0 opacity-50 mix-blend-color-dodge"
        style={{ filter: `url(#${ICON_GLOW_FILTER_ID})` }}
      >
        <SlotIcon archetype={archetype} />
      </div>
    </>
  );
}

/** The frame's own icon: back ring, badge, then the ring's near arc across the badge. */
function PrizewinnerIcon() {
  const ring = (
    <div className="absolute inset-[-0.17%_-1.82%]">
      <img alt="" src={`${ASSETS}/prizewinner-ring.svg`} className="block size-full max-w-none" />
    </div>
  );
  return (
    <>
      <div className="absolute top-[885.81px] left-[118.19px] h-[285.41px] w-[399.412px]">
        {ring}
      </div>
      <div className="absolute top-[862.07px] left-[144.8px] flex size-[333.167px] items-center justify-center">
        <img
          alt=""
          src={`${ASSETS}/prizewinner-badge.svg`}
          className="-scale-y-100 block size-[253.29px] max-w-none flex-none rotate-[66.55deg]"
        />
      </div>
      {/* The front and back rings are the same drawing; the mask keeps only the arc that
          passes in front of the badge. */}
      <div
        className="absolute top-[885.82px] left-[118.19px] h-[285.41px] w-[399.412px]"
        style={mask("prizewinner-ring-mask", "274.326px 186.397px", "76.17px 78.255px")}
      >
        {ring}
      </div>
    </>
  );
}

function HackathonPlanet({ number, suffix }: { number: string; suffix: string }) {
  return (
    <>
      <img
        alt=""
        src={`${ASSETS}/planet.svg`}
        className="absolute top-[886px] left-[604px] size-[320px] max-w-none"
      />
      <img
        alt=""
        src={`${ASSETS}/planet-swirl.svg`}
        className="absolute top-[883.94px] left-[591px] h-[324.057px] w-[345.944px] max-w-none mix-blend-color-dodge"
        style={mask("planet-mask", "320px 320px", "13px 2.057px")}
      />
      <img
        alt=""
        src={`${ASSETS}/planet-shade.svg`}
        className="absolute top-[886px] left-[604px] size-[320px] max-w-none mix-blend-multiply"
        style={mask("planet-mask", "320px 320px", "0 0")}
      />
      {/* The suffix rides high, like a superscript, as in the frame. */}
      <p className="-translate-x-1/2 absolute top-[975px] left-[773.5px] flex items-start whitespace-nowrap text-[#473c78] leading-[1.3]">
        <span className="font-black text-[108px]">{number}</span>
        <span className="font-extrabold text-[69.66px]">{suffix}</span>
      </p>
      <Caption x={776} y={1239}>
        nwHackathon
      </Caption>
    </>
  );
}

/** The open stampbook: two back pages, the front spread, its spine and stamps. */
function Stampbook({ count, label }: { count: string; label: string }) {
  return (
    <>
      <img
        alt=""
        src={`${ASSETS}/stampbook-back-3.svg`}
        className="absolute top-[1353px] left-[573px] h-[240px] w-[360px] max-w-none"
      />
      <img
        alt=""
        src={`${ASSETS}/stampbook-back-2.svg`}
        className="absolute top-[1353px] left-[577px] h-[240px] w-[352px] max-w-none"
      />
      <div
        className="absolute top-[1353px] left-[581px] h-[240px] w-[172px] rounded-tl-[8px] rounded-tr-[24px] rounded-bl-[8px]"
        style={{
          backgroundImage:
            "linear-gradient(147.25deg, rgb(229, 218, 255) 15.456%, rgb(185, 169, 241) 96.302%)",
        }}
      />
      <div className="absolute top-[1353px] left-[753px] h-[240px] w-[172px] rounded-tl-[24px] rounded-tr-[8px] rounded-br-[8px] bg-gradient-to-t from-[#e2d6ff] to-[#c6b6ef]" />
      {/* The spine: a 220px horizontal line, stood upright down the middle of the spread. */}
      <img
        alt=""
        src={`${ASSETS}/stampbook-spine.svg`}
        className="-rotate-90 absolute top-[1481.5px] left-[643.5px] h-[3px] w-[220px] max-w-none"
      />
      {STAMPS.map(([src, x, y, multiply]) => (
        <img
          key={`${x}-${y}`}
          alt=""
          src={`${ASSETS}/${src}.svg`}
          className={`absolute size-[56px] max-w-none ${multiply ? "mix-blend-multiply" : ""}`}
          style={{ left: x, top: y }}
        />
      ))}
      {STAMP_LINES.map(([x, y, wide]) => (
        <div
          key={`${x}-${y}`}
          className="absolute h-[4px] rounded-[2px] bg-[#8e7eb4] mix-blend-multiply"
          style={{ left: x, top: y, width: wide ? 60 : 40, opacity: wide ? 0.4 : 0.6 }}
        />
      ))}
      <div className="-translate-x-1/2 absolute top-[1593px] left-[753px] whitespace-nowrap text-center font-semibold leading-[1.3]">
        <p className="font-black text-[#20ffaf] text-[108px] leading-[123px]">{count}</p>
        <p className="text-[48px]">{label}</p>
      </div>
    </>
  );
}

/** Stamp art on the spread: [asset, x, y, multiply-blended]. */
const STAMPS: [string, number, number, boolean][] = [
  ["stamp-yellow", 604, 1380, false],
  ["stamp-blue", 676, 1380, false],
  ["stamp-pink", 604, 1473, false],
  ["stamp-green", 676, 1473, false],
  ["stamp-purple", 775, 1380, false],
  ["stamp-empty", 773, 1473, true],
  ["stamp-empty", 847, 1380, true],
  ["stamp-empty", 845, 1473, true],
];

/**
 * The text lines under each stamp: a short line, then two wide ones. [x, y, wide] — wide
 * lines start 10px left of the short one.
 */
const STAMP_LINES: [number, number, boolean][] = [
  [612, 1443],
  [612, 1535],
  [684, 1535],
  [684, 1443],
  [783, 1443],
  [855, 1443],
  [783, 1537],
  [855, 1537],
].flatMap(([x, y]): [number, number, boolean][] => [
  [x, y, false],
  [x - 10, y + 9, true],
  [x - 10, y + 17, true],
]);

/** An alpha mask from one of the card's SVGs, prefixed for WebKit. */
function mask(src: string, size: string, position: string): CSSProperties {
  const image = `url("${ASSETS}/${src}.svg")`;
  return {
    maskImage: image,
    maskSize: size,
    maskPosition: position,
    maskRepeat: "no-repeat",
    maskMode: "alpha",
    WebkitMaskImage: image,
    WebkitMaskSize: size,
    WebkitMaskPosition: position,
    WebkitMaskRepeat: "no-repeat",
  };
}
