import { CompCanvas } from "@/components/features/wrapped/comp-canvas";
import { ROCKET_IMAGES, RocketShip } from "@/components/features/wrapped/rocket-ship";
import { preloadFont, preloadImages } from "@/lib/wrapped/preload";
import { type CSSProperties, useEffect, useRef } from "react";

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

/** Every image the slide draws, the ship's included, for preloading before the entrances. */
const INTRO_IMAGES = [
  ...["backdrop.webp", "stars.svg", "moon.svg", "steam-clouds.svg", "steam-trail.svg"].map(
    (file) => `${ASSETS}/${file}`,
  ),
  ...ROCKET_IMAGES,
];

/** The title's faces: "Your {year}" and "Wrapped" at 400, the event name at 700. */
const INTRO_FONTS = ['400 86px "Hanken Grotesk"', '700 141px "Hanken Grotesk"'];

/**
 * Calls `onReady` once the slide's images are decoded and its fonts loaded. The entrances
 * only mount when the slide is active, and the deck holds `active` until this fires, so
 * nothing animates in over artwork that's still arriving.
 */
function useIntroAssets(onReady: (() => void) | undefined) {
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    let cancelled = false;
    void Promise.all([preloadImages(INTRO_IMAGES), ...INTRO_FONTS.map(preloadFont)]).then(() => {
      if (!cancelled) onReadyRef.current?.();
    });
    return () => {
      cancelled = true;
    };
  }, []);
}

/**
 * @param event - display name, e.g. "HackCamp 2026"; the trailing year is split off onto
 *   its own line
 * @param skipRocketEntrance - render the rocket already on its pad instead of rising
 *   into view — the launch fly-up climbing past it just played that same move
 * @param onReady - called once the slide's images and fonts are loaded
 */
export function IntroSlide({
  event,
  active,
  skipRocketEntrance = false,
  onReady,
}: {
  event: string;
  active: boolean;
  skipRocketEntrance?: boolean;
  onReady?: () => void;
}) {
  useIntroAssets(onReady);
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

/**
 * The sky behind everything: its gradient, the green glow and its noise, and the two light
 * spots, baked into one image from the coded layers that drew them. Live, their masks and
 * blend modes were repainted on the CPU on every frame of the pan and fades, enough to crash
 * iOS Safari; as an image the backdrop is drawn once. The stars stay live to twinkle.
 */
function Background() {
  return (
    <>
      <img
        alt=""
        src={`${ASSETS}/backdrop.webp`}
        className="absolute top-0 left-0 h-[3908px] w-[1080px] max-w-none"
      />
      <img
        alt=""
        src={`${ASSETS}/stars.svg`}
        className="wrapped-twinkle absolute top-[158px] left-[102px] h-[2105.74px] w-[858px] max-w-none"
      />
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
