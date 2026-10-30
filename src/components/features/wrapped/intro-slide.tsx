import { CompCanvas } from "@/components/features/wrapped/comp-canvas";
import { RocketShip } from "@/components/features/wrapped/rocket-ship";
import type { CSSProperties } from "react";

/**
 * The opening slide: a rocket lifting off, then the camera pans up the 1080x3908 comp to
 * the moon and the deck's title.
 *
 * Built from the "Intro" frame in Figma's Hacker Wrapped "Final Handoff" section, laid
 * out in comp pixels. The design's annotation calls for the rocket first, then the star
 * background fading in, so the stage opens on the comp's bottom and pans up.
 */

const ASSETS = "/assets/wrapped/intro";
const INTRO_HEIGHT = 3908;
/** How far the tall comp starts shifted up, so the stage opens on its bottom. */
const PAN_DISTANCE = INTRO_HEIGHT - 1920;

/** Entrance start times, in ms from the slide becoming active. */
const TIMING = {
  rocket: 0,
  background: 500,
  pan: 1300,
  title: 3900,
} as const;
const PAN_DURATION = 2800;

const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

function enter(name: string, delay: number, duration = 900): CSSProperties {
  return { animation: `${name} ${duration}ms ${ease} ${delay}ms both` };
}

const titleGlow = "2.847px 2.847px 142.329px #c4b2f0";

/**
 * @param event - display name, e.g. "HackCamp 2026"; the trailing year is split off onto
 *   its own line
 * @param skipRocketEntrance - render the rocket already on its pad instead of rising
 *   into view — the launch fly-up climbing past it just played that same move
 */
export function IntroSlide({
  event,
  active,
  skipRocketEntrance = false,
}: {
  event: string;
  active: boolean;
  skipRocketEntrance?: boolean;
}) {
  const match = event.match(/^(.*?)\s*(\d{4})$/);
  const name = match ? match[1] : event;
  const year = match?.[2];

  return (
    <CompCanvas className="bg-[#1a1138]">
      {/* Remounting on activation replays every entrance from the top. */}
      {active && (
        <div
          className="absolute top-0 left-0 w-[1080px] font-['Hanken_Grotesk'] text-[#fff]"
          style={{
            height: INTRO_HEIGHT,
            // Held on the comp's bottom until the pan starts, then eased up to its top.
            animation: `wrapped-pan ${PAN_DURATION}ms cubic-bezier(0.65, 0, 0.35, 1) ${TIMING.pan}ms both`,
            ["--wrapped-pan-from" as string]: `-${PAN_DISTANCE}px`,
          }}
        >
          <div className="absolute inset-0" style={enter("wrapped-fade", TIMING.background, 1200)}>
            <Background />
          </div>

          {/* Moon and title */}
          <div className="absolute inset-0" style={enter("wrapped-fade", TIMING.title - 600, 1400)}>
            <div className="-translate-x-1/2 -translate-y-1/2 absolute top-[947px] left-[489.82px] h-[924px] w-[830.101px]">
              <div className="absolute inset-[-15.1%_-17.49%_-15.71%_-16.8%]">
                <img alt="" src={`${ASSETS}/moon.svg`} className="block size-full max-w-none" />
              </div>
            </div>
          </div>
          <div
            className="absolute top-[759px] left-[271px] flex w-[698px] flex-col text-center leading-normal"
            style={enter("wrapped-rise", TIMING.title)}
          >
            {year && (
              <p className="-mb-[18px] text-[86px]" style={{ textShadow: titleGlow }}>
                Your {year}
              </p>
            )}
            <p
              className="-mb-[18px] bg-clip-text font-bold text-[141px] text-transparent"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse at 0% 0%, #c4b2f0 0%, #f0eef2 100%), linear-gradient(#fff, #fff)",
                filter: "drop-shadow(2.847px 2.847px 71px #c4b2f0)",
              }}
            >
              {name}
            </p>
            <p className="text-[86px]" style={{ textShadow: "2.647px 2.647px 132.359px #c4b2f0" }}>
              Wrapped
            </p>
          </div>

          <div
            className="absolute inset-0"
            style={skipRocketEntrance ? undefined : enter("wrapped-rise-far", TIMING.rocket, 1100)}
          >
            <Rocket />
          </div>
        </div>
      )}
    </CompCanvas>
  );
}

function Background() {
  return (
    <>
      <div
        className="absolute top-0 left-[-3px] h-[3908px] w-[1083px]"
        style={{ backgroundImage: "linear-gradient(180deg, #1a1138 37.734%, #58357b 80.365%)" }}
      />

      {/* Green glow */}
      <div className="absolute top-[2492.72px] left-[-990.69px] flex h-[2295.211px] w-[3355.959px] items-center justify-center">
        <div className="flex-none rotate-[-9.11deg]">
          <div
            className="relative h-[1826.337px] w-[3105.9px]"
            style={{
              maskImage: `url("${ASSETS}/glow-mask.svg")`,
              maskSize: "3976.118px 2490px",
              maskPosition: "-553.306px 35.278px",
              maskRepeat: "no-repeat",
            }}
          >
            <img
              alt=""
              src={`${ASSETS}/glow.svg`}
              className="absolute inset-0 block size-full max-w-none"
            />
          </div>
        </div>
      </div>
      <div className="absolute top-[2771.97px] left-[-997.51px] flex h-[1899.858px] w-[3492.447px] items-center justify-center mix-blend-overlay">
        <div className="flex-none rotate-[-9.11deg]">
          <div
            className="relative h-[1392.596px] w-[3313.708px]"
            style={{
              maskImage: `url("${ASSETS}/glow-mask.svg")`,
              maskSize: "3976.118px 2490px",
              maskPosition: "-546.492px -243.971px",
              maskRepeat: "no-repeat",
            }}
          >
            <div
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage: `url("${ASSETS}/noise.png")`,
                backgroundSize: "390.911px 390.911px",
              }}
            />
          </div>
        </div>
      </div>

      <img
        alt=""
        src={`${ASSETS}/stars.svg`}
        className="wrapped-twinkle absolute top-[158px] left-[102px] h-[2105.74px] w-[858px] max-w-none"
      />

      <div
        className="absolute top-[1818px] left-[573px] h-[689.483px] w-[701.463px] opacity-60 mix-blend-soft-light"
        style={{
          backgroundImage: "radial-gradient(closest-side, #fff 0%, rgba(255,255,255,0) 100%)",
        }}
      />
      <div className="absolute top-[2599px] left-[-451.55px] flex h-[638.909px] w-[1245.09px] items-center justify-center mix-blend-hard-light">
        <div className="flex-none rotate-[-11.4deg]">
          <div
            className="h-[412.433px] w-[1186.988px] opacity-22"
            style={{
              backgroundImage:
                "radial-gradient(closest-side, rgba(111,0,252,1) 0%, rgba(147,46,244,0.75) 25%, rgba(183,93,235,0.5) 50%, rgba(255,186,219,0) 100%)",
            }}
          />
        </div>
      </div>
    </>
  );
}

function Rocket() {
  return (
    <>
      <img
        alt=""
        src={`${ASSETS}/steam-clouds.svg`}
        className="absolute top-[3387px] left-[-510.55px] h-[981.999px] w-[1916.795px] max-w-none"
      />
      <img
        alt=""
        src={`${ASSETS}/steam-trail.svg`}
        className="absolute top-[2875px] left-[267.08px] h-[1010.419px] w-[501.783px] max-w-none"
      />
      <div className="wrapped-bob absolute top-[2211px] left-[283.45px]">
        <RocketShip />
      </div>
    </>
  );
}
