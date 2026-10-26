import { CompCanvas } from "@/components/features/wrapped/comp-canvas";
import type { ComparisonStat, WrappedDoc } from "@/lib/firebase/types/wrapped";
import { formatOneDecimal } from "@/lib/wrapped/scenes";
import type { CSSProperties } from "react";

/**
 * Where the hacker ranked on their featured stat: "Top 0.3% of Lines Committed".
 *
 * Built from Figma's "Cross-Hacker Comparison - Most Commits Pushed" frame, laid out in
 * comp pixels. One frame serves all three stats; only the copy changes. Which stat is
 * shown is the batch script's call (`crossHackerComparison.featured`), never this
 * component's.
 *
 * The percentage rolls in as a CSS odometer rather than a JS counter, so the slide
 * exporter's `settleAnimations()` can jump it to its final digits for a saved image.
 */

const ASSETS = "/assets/wrapped/comparison";

const TIMING = {
  background: 0,
  line1: 150,
  line2: 1100,
  /** Red then purple stars, each `starStep` after the last. */
  stars: 1900,
  starStep: 100,
  topStar: 2600,
  topWord: 2900,
  percentStar: 3300,
  /** The odometer rolls from here until 5000. */
  percent: 3600,
  ofStar: 5000,
  ofWord: 5300,
  title: 5700,
} as const;

const PERCENT_ROLL_MS = 1400;
/** Full turns the rightmost digit makes before landing; each column to its left makes one fewer. */
const ODOMETER_TURNS = 3;
/** Figma's "normal" leading for this font, as on every text here: 259px tall at 198.545px. */
const ODOMETER_LEADING = 1.3;

/**
 * Line 1 stays on one line, shrinking from Figma's 70px when the copy outgrows the 982px
 * box ("You pushed 161,959 lines of code."). Hanken Grotesk SemiBold averages about 0.46em
 * a character; `whitespace-nowrap` keeps a slight misjudgement from wrapping.
 */
function lineFontSize(text: string): number {
  return Math.min(70, Math.floor(982 / (text.length * 0.46)));
}

const COPY: Record<ComparisonStat, { line: (count: number) => string; title: string }> = {
  lines: {
    line: (n) => `You pushed ${n.toLocaleString()} ${n === 1 ? "line" : "lines"} of code.`,
    title: "Lines Committed",
  },
  stamps: {
    line: (n) => `You collected ${n.toLocaleString()} ${n === 1 ? "stamp" : "stamps"}.`,
    title: "Stamps Collected",
  },
  events: {
    line: (n) => `You attended ${n.toLocaleString()} ${n === 1 ? "event" : "events"}.`,
    title: "Workshops & Events",
  },
};

function enter(name: string, delay: number, duration = 800): CSSProperties {
  return { animation: `${name} ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms both` };
}

/** The idle twinkle, starting once the background has faded in; `offset` desyncs the stars. */
function twinkle(offset: number): CSSProperties {
  return { animation: `wrapped-twinkle 3s ease-in-out ${1000 + offset}ms infinite` };
}

export function ComparisonSlide({
  comparison,
  active,
}: {
  comparison: WrappedDoc["crossHackerComparison"];
  active: boolean;
}) {
  const featured = comparison.featured;
  const stat = featured ? comparison[featured] : null;
  if (!featured || !stat) return null;
  const copy = COPY[featured];
  const line = copy.line(stat.count);

  return (
    <CompCanvas className="bg-[#1a1138]">
      {active && (
        <div className="absolute inset-0 font-['Hanken_Grotesk'] font-black text-[#fff]">
          <div className="absolute inset-0" style={enter("wrapped-fade", TIMING.background, 1000)}>
            <SpaceBackground />
          </div>

          {BACKGROUND_STARS.map((star, i) => (
            <div
              key={star.src}
              className="absolute"
              style={{
                left: star.x,
                top: star.y,
                width: star.size,
                height: star.size,
                ...enter(star.from, TIMING.stars + i * TIMING.starStep, 900),
              }}
            >
              <div className="absolute" style={{ inset: star.inset }}>
                <img alt="" src={`${ASSETS}/${star.src}`} className="block size-full max-w-none" />
              </div>
            </div>
          ))}

          <BlueStar
            className="top-[263px] left-[-157px] size-[697.257px]"
            star="top-star"
            rotate={-9.25}
            starSize={607.474}
            glowInset="-3.17% -1.47% 3.49% -1.47%"
            starInset="9.42% 11.13% 16.08% 11.13%"
            delay={TIMING.topStar}
            duration={700}
          />
          <BlueStar
            className="top-[915px] left-[694px] size-[539.044px]"
            star="of-star"
            rotate={3.99}
            starSize={505.134}
            glowInset="-5.07% -3.26% 2.01% -3.26%"
            starInset="7.52% 9.34% 14.6% 9.34%"
            delay={TIMING.ofStar}
            duration={600}
          />
          <StarWord
            className="top-[496.4px] left-[calc(50%-348.84px)] h-[229.757px] w-[260.328px] rotate-[-9.25deg]"
            delay={TIMING.topWord}
          >
            Top
          </StarWord>
          <StarWord
            className="top-[1098.8px] left-[calc(50%+422.35px)] h-[203.508px] w-[142.263px] rotate-[3.99deg]"
            delay={TIMING.ofWord}
          >
            of
          </StarWord>

          <div
            className="absolute top-[468px] left-[48px] size-[984px]"
            style={enter("wrapped-pop", TIMING.percentStar, 800)}
          >
            <div className="absolute inset-[-18.3%_-16.09%_-9.66%_-16.09%]">
              <img alt="" src={`${ASSETS}/green-star.svg`} className="block size-full max-w-none" />
            </div>
            <Odometer
              className="-translate-x-1/2 absolute top-[317.42px] left-1/2 text-[198.545px]"
              value={stat.topPercentage}
            />
          </div>

          <p
            className="-translate-x-1/2 absolute top-[1433px] left-[calc(50%+0.5px)] w-[725px] text-center text-[124px] leading-[1.3]"
            style={enter("wrapped-rise", TIMING.title, 700)}
          >
            {copy.title}
          </p>

          <div className="-translate-x-1/2 absolute top-[190px] left-1/2 w-[982px] text-center font-semibold text-[70px] leading-[1.3]">
            <p
              className="h-[91px] whitespace-nowrap leading-[91px]"
              style={{ fontSize: lineFontSize(line), ...enter("wrapped-rise", TIMING.line1, 700) }}
            >
              {line}
            </p>
            <p style={enter("wrapped-rise", TIMING.line2, 700)}>You were in the</p>
          </div>
        </div>
      )}
    </CompCanvas>
  );
}

/**
 * The percentage, one rolling column per digit and a static "." and "%". Each column is
 * a strip of 0–9 repeated, moved by `wrapped-odometer` to its digit after a few turns.
 */
function Odometer({ value, className }: { value: number; className: string }) {
  const chars = [...formatOneDecimal(value)];
  const digitCount = chars.filter((char) => char !== ".").length;
  let digitIndex = 0;

  return (
    <div
      className={`${className} flex whitespace-nowrap tabular-nums`}
      style={{ lineHeight: ODOMETER_LEADING }}
    >
      {chars.map((char, i) => {
        if (char === ".") {
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: the characters never reorder
            <span key={i}>.</span>
          );
        }
        // The rightmost digit makes the most turns.
        const turns = ODOMETER_TURNS - (digitCount - 1 - digitIndex++);
        const stop = Math.max(turns, 1) * 10 + Number(char);
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: the characters never reorder
            key={i}
            className="block overflow-hidden"
            style={{ height: `${ODOMETER_LEADING}em` }}
          >
            <span
              className="flex flex-col"
              style={
                {
                  "--wrapped-odometer-to": `${-stop * ODOMETER_LEADING}em`,
                  animation: `wrapped-odometer ${PERCENT_ROLL_MS}ms cubic-bezier(0.22, 1, 0.36, 1) ${TIMING.percent}ms both`,
                } as CSSProperties
              }
            >
              {Array.from({ length: (ODOMETER_TURNS + 1) * 10 }, (_, cell) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: a fixed strip of digits
                <span key={cell}>{cell % 10}</span>
              ))}
            </span>
          </span>
        );
      })}
      <span>%</span>
    </div>
  );
}

/** A glowing blue star, its glow and face both rotated with the word on it. */
function BlueStar({
  className,
  star,
  rotate,
  starSize,
  glowInset,
  starInset,
  delay,
  duration,
}: {
  className: string;
  star: "top-star" | "of-star";
  rotate: number;
  starSize: number;
  glowInset: string;
  starInset: string;
  delay: number;
  duration: number;
}) {
  return (
    <div className={`absolute ${className}`} style={enter("wrapped-pop", delay, duration)}>
      {[
        [`${star}-glow`, glowInset],
        [star, starInset],
      ].map(([src, inset]) => (
        <div key={src} className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative flex-none"
            style={{ width: starSize, height: starSize, rotate: `${rotate}deg` }}
          >
            <div className="absolute" style={{ inset }}>
              <img alt="" src={`${ASSETS}/${src}.svg`} className="block size-full max-w-none" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StarWord({
  className,
  delay,
  children,
}: {
  className: string;
  delay: number;
  children: string;
}) {
  return (
    <div
      className={`-translate-x-1/2 absolute flex items-center justify-center ${className}`}
      style={enter("wrapped-fade", delay, 400)}
    >
      <p className="whitespace-nowrap text-center text-[150px] leading-[1.3]">{children}</p>
    </div>
  );
}

/** Red then purple, in stagger order; each slides in from its nearest edge. */
const BACKGROUND_STARS = [
  {
    src: "red-star-1.svg",
    x: 856.168,
    y: 656,
    size: 268.02,
    inset: "2.08% 4.29% 10.69% 4.29%",
    from: "wrapped-slide-right",
  },
  {
    src: "red-star-2.svg",
    x: 350.316,
    y: 1116,
    size: 316.956,
    inset: "3.58% 5.69% 11.82% 5.69%",
    from: "wrapped-slide-left",
  },
  {
    src: "red-star-3.svg",
    x: 243,
    y: 453.895,
    size: 339.03,
    inset: "2.38% 4.53% 10.78% 4.53%",
    from: "wrapped-slide-left",
  },
  {
    src: "purple-star-1.svg",
    x: 618.273,
    y: 437,
    size: 406.142,
    inset: "8.48% 10.31% 15.63% 10.31%",
    from: "wrapped-slide-right",
  },
  {
    src: "purple-star-2.svg",
    x: -38.578,
    y: 1001.09,
    size: 461.669,
    inset: "2.48% 4.62% 10.84% 4.62%",
    from: "wrapped-slide-left",
  },
] as const;

/** [x, y] of each purple texture's fill; its noise overlay sits at a fixed offset. */
const PURPLE_TEXTURES = [
  [-274.9, 381.24],
  [-115.9, -171.76],
  [168.1, 381.24],
] as const;
const GREEN_TEXTURES = [
  [-403.01, 257.9],
  [294.99, -23.1],
  [-45.01, 662.9],
] as const;

/** [file, x, y, size] */
const DOTS = [
  ["dot-37.svg", 942, 437, 37],
  ["dot-37.svg", 110, 1417, 37],
  ["dot-29.svg", 862, 1555, 29],
  ["dot-18a.svg", 192, 1702, 18],
  ["dot-18a.svg", 699, 172, 18],
  ["dot-29.svg", 275, 276, 29],
  ["dot-51.svg", 84, 909, 51],
  ["dot-51.svg", 862, 938, 51],
  ["dot-51.svg", 540, 1282, 51],
  ["dot-18b.svg", 61, 119, 18],
  ["dot-12.svg", 556, 15, 12],
  ["dot-12.svg", 1051, 69, 12],
  ["dot-12.svg", 688, 1793, 12],
  ["dot-12.svg", 1025, 1889, 12],
  ["dot-12.svg", 29, 1835, 12],
] as const;

/** [x, y, box width, box height, rotation, width, height]; sparkle-{i + 1}.svg. */
const SPARKLES = [
  [946, 1707.9, 20.164, 21.539, -11.61, 16.776, 18.541],
  [320, 1804.91, 23.431, 24.185, 27.43, 16.776, 18.541],
  [742, 1391.92, 50.628, 46.285, 86.87, 43.713, 48.315],
  [201, 1230.93, 108.856, 101.935, 78.29, 84.7, 93.616],
  [116, 1582.92, 48.578, 47.462, 121.91, 33.117, 36.604],
  [832, 1019.95, 103.466, 95.735, 97.18, 84.7, 93.616],
  [566, 427, 141.85, 137.066, 116.07, 99.039, 109.465],
  [72, 326, 82.371, 78.456, 70.96, 60.081, 66.405],
  [935, 154, 26.311, 28.675, -4.32, 24.353, 26.917],
  [249, 75, 30.87, 28.811, -79.6, 24.353, 26.917],
  [753, 13, 19.715, 20.441, -154.88, 14.343, 15.852],
] as const;

/**
 * The frame's gradient, its noisy purple and green textures, and the overlay stars. The
 * gradient is in here, not on the canvas, so the stars' overlay blend has it to blend with.
 */
function SpaceBackground() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{ backgroundImage: "linear-gradient(180deg, #1a1138 37.734%, #343367 80.365%)" }}
      />

      {PURPLE_TEXTURES.map(([x, y]) => (
        <div key={`purple-${x}-${y}`}>
          <div
            className="absolute flex h-[1519.251px] w-[1315.708px] items-center justify-center"
            style={{ left: x, top: y }}
          >
            <div
              className="relative h-[1324.895px] w-[1058.931px] flex-none rotate-[-12.24deg]"
              style={{
                maskImage: `url("${ASSETS}/purple-texture-mask.svg")`,
                maskSize: "1162px 1234.498px",
                maskPosition: "74.898px 219.758px",
                maskRepeat: "no-repeat",
              }}
            >
              <img
                alt=""
                src={`${ASSETS}/purple-texture.svg`}
                className="absolute inset-0 block size-full max-w-none"
              />
            </div>
          </div>
          <div
            className="absolute flex h-[1530.23px] w-[1644.345px] items-center justify-center mix-blend-overlay"
            style={{ left: x - 127.64, top: y + 70.99 }}
          >
            <div
              className="relative h-[1260.145px] w-[1409.254px] flex-none rotate-[-12.24deg]"
              style={{
                maskImage: `url("${ASSETS}/purple-texture-mask.svg")`,
                maskSize: "1162px 1234.498px",
                maskPosition: "202.535px 148.767px",
                maskRepeat: "no-repeat",
              }}
            >
              <Noise size={240.174} />
            </div>
          </div>
        </div>
      ))}

      {GREEN_TEXTURES.map(([x, y]) => (
        <div key={`green-${x}-${y}`}>
          <div
            className="absolute flex size-[1264.99px] items-center justify-center"
            style={{ left: x, top: y }}
          >
            <div
              className="relative size-[1104.06px] flex-none rotate-[-9.11deg] opacity-50"
              style={{
                maskImage: `url("${ASSETS}/green-texture-mask.svg")`,
                maskSize: "1489.347px 1358.596px",
                maskPosition: "-194.988px 23.099px",
                maskRepeat: "no-repeat",
              }}
            >
              <img
                alt=""
                src={`${ASSETS}/green-texture.svg`}
                className="absolute inset-0 block size-full max-w-none"
              />
            </div>
          </div>
          <div
            className="absolute flex h-[1017.794px] w-[1296.398px] items-center justify-center mix-blend-overlay"
            style={{ left: x + 9.7, top: y + 174.8 }}
          >
            <div
              className="relative h-[841.854px] w-[1177.93px] flex-none rotate-[-9.11deg] opacity-50"
              style={{
                maskImage: `url("${ASSETS}/green-texture-mask.svg")`,
                maskSize: "1489.347px 1358.596px",
                maskPosition: "-204.688px -151.695px",
                maskRepeat: "no-repeat",
              }}
            >
              <Noise size={236.314} />
            </div>
          </div>
        </div>
      ))}

      {DOTS.map(([src, x, y, size], i) => (
        <img
          key={`${x}-${y}`}
          alt=""
          src={`${ASSETS}/${src}`}
          className="absolute block max-w-none mix-blend-overlay"
          style={{ left: x, top: y, width: size, height: size, ...twinkle(i * 230) }}
        />
      ))}

      {SPARKLES.map(([x, y, boxWidth, boxHeight, rotate, width, height], i) => (
        <div
          key={`${x}-${y}`}
          className="absolute flex items-center justify-center mix-blend-overlay"
          style={{ left: x, top: y, width: boxWidth, height: boxHeight, ...twinkle(i * 310) }}
        >
          <img
            alt=""
            src={`${ASSETS}/sparkle-${i + 1}.svg`}
            className="block max-w-none flex-none"
            style={{ width, height, rotate: `${rotate}deg` }}
          />
        </div>
      ))}
    </>
  );
}

function Noise({ size }: { size: number }) {
  return (
    <div
      className="absolute inset-0 opacity-50"
      style={{
        backgroundImage: `url("${ASSETS}/noise.png")`,
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  );
}
