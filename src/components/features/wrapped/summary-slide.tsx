import { CompCanvas } from "@/components/features/wrapped/comp-canvas";
import type { CSSProperties, ReactNode } from "react";

/**
 * The closing slide of Wrapped: a thank-you from the team, signed off the way the
 * application status page is, with the share action below it.
 *
 * Built on the "Summary Slide" frame's backdrop from Figma's Hacker Wrapped "Final
 * Handoff" section, laid out in comp pixels and scaled as one unit like every slide.
 */

export type SummaryData = {
  /** The event's display name, e.g. "HackCamp 2026". */
  hackathon: string;
};

const ASSETS = "/assets/wrapped/summary";

/** Entrance start times, in ms from the slide becoming active. */
const TIMING = {
  title: 150,
  rocket: 300,
  /** The message's first line; each next one follows by `lineStep`. */
  message: 1100,
  lineStep: 1500,
} as const;

/** How long the slide takes to settle — the share action waits for this. */
export const SUMMARY_SETTLE_MS = TIMING.message + TIMING.lineStep * 3 + 600;

/** A keyframe entrance from styles.css, held at its first frame until `delay`. */
function enter(name: string, delay: number, duration = 700): CSSProperties {
  return { animation: `${name} ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms both` };
}

/**
 * Mounted hidden alongside the playing slide, so it is ready at the right size the
 * moment it is shown; `active` restarts the entrance.
 *
 * `action` renders under the sign-off (the deck's share button). It is left out when
 * the slide is exported, so the saved image is just the slide.
 */
export function SummarySlide({
  data,
  active,
  action,
}: {
  data: SummaryData;
  active: boolean;
  action?: ReactNode;
}) {
  return (
    <CompCanvas className="wrapped-summary bg-[#2c2543]">
      {/* Remounting on activation replays every entrance from the top. */}
      {active ? <SummaryComp data={data} action={action} /> : <SummaryBackground />}
    </CompCanvas>
  );
}

function SummaryBackground() {
  return (
    <img
      alt=""
      src={`${ASSETS}/background.png`}
      className="absolute inset-0 size-full"
      draggable={false}
    />
  );
}

/** Splits "HackCamp 2026" into the name and its year, so the year can be accented. */
function hackathonName(hackathon: string) {
  return hackathon.replace(/\s*\d{4}$/, "");
}

function SummaryComp({ data, action }: { data: SummaryData; action?: ReactNode }) {
  const lines = [
    `Thank you for coming to ${hackathonName(data.hackathon)}`,
    "We loved having you and hope to see you again :)",
  ];

  return (
    <div className="absolute inset-0 font-['Hanken_Grotesk'] text-[#c5fffb]">
      <SummaryBackground />

      <div className="absolute inset-0" style={enter("wrapped-fade", 0, 1200)}>
        <img
          alt=""
          src={`${ASSETS}/stars.svg`}
          className="wrapped-twinkle absolute top-[288px] left-[64px] h-[1460px] w-[976px] max-w-none"
        />
      </div>

      <Rocket />

      <p
        className="-translate-x-1/2 absolute top-[200px] left-1/2 w-[880px] text-center font-black text-[84px] leading-[1.1]"
        style={enter("wrapped-rise", TIMING.title, 800)}
      >
        <span className="text-[#20ffaf]">{data.hackathon}</span> Wrapped
      </p>

      <div className="-translate-x-1/2 absolute top-[680px] left-1/2 flex w-[860px] flex-col items-center gap-[48px] text-center">
        {lines.map((line, i) => (
          <p
            key={line}
            className="font-bold text-[48px] leading-[1.25]"
            style={enter("wrapped-rise", TIMING.message + i * TIMING.lineStep, 1200)}
          >
            {line}
          </p>
        ))}
        <p
          className="font-cursive text-[60px] leading-normal"
          style={enter("wrapped-rise", TIMING.message + lines.length * TIMING.lineStep, 1200)}
        >
          - nwPlus Team
        </p>
        {action && (
          <div className="mt-[40px]" style={enter("wrapped-fade", SUMMARY_SETTLE_MS - 300, 600)}>
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

/** Flies in from off the bottom-left corner, then idles with a slow bob. */
function Rocket() {
  return (
    <div className="absolute inset-0" style={enter("wrapped-rocket-in", TIMING.rocket, 1400)}>
      <div className="wrapped-bob absolute inset-0">
        <div className="absolute top-[1826.38px] left-[80.25px] flex h-[115.194px] w-[156.076px] items-center justify-center">
          <img
            alt=""
            src={`${ASSETS}/rocket-flame-small.svg`}
            className="wrapped-flicker h-[59.803px] w-[142.716px] max-w-none rotate-25"
          />
        </div>
        <div className="absolute top-[1783.46px] left-[58.03px] flex h-[148.218px] w-[226.897px] items-center justify-center">
          <img
            alt=""
            src={`${ASSETS}/rocket-flame-large.svg`}
            className="wrapped-flicker h-[59.803px] w-[219.921px] max-w-none rotate-25 [animation-delay:-150ms]"
          />
        </div>
        <div className="absolute top-[1606.01px] left-[-28.14px] flex h-[250.169px] w-[208.088px] items-center justify-center">
          <img
            alt=""
            src={`${ASSETS}/rocket-fin-left.svg`}
            className="h-[215.917px] w-[128.916px] max-w-none rotate-25"
          />
        </div>
        <div className="absolute top-[1719.66px] left-[225.03px] flex h-[250.169px] w-[208.088px] items-center justify-center">
          <img
            alt=""
            src={`${ASSETS}/rocket-fin-right.svg`}
            className="-rotate-155 -scale-y-100 h-[215.917px] w-[128.916px] max-w-none"
          />
        </div>
        <div className="absolute top-[1379.76px] left-[259.13px] flex h-[184.772px] w-[179.286px] items-center justify-center">
          <img
            alt=""
            src={`${ASSETS}/rocket-nose.svg`}
            className="h-[142.645px] w-[131.304px] max-w-none rotate-25"
          />
        </div>
        <div className="absolute top-[1436.95px] left-[67.61px] flex h-[464.882px] w-[382.687px] items-center justify-center">
          <img
            alt=""
            src={`${ASSETS}/rocket-body.svg`}
            className="h-[403.86px] w-[233.925px] max-w-none rotate-25"
          />
        </div>
        <div className="absolute top-[1560.45px] left-[176.05px] flex h-[186.13px] w-[186.129px] items-center justify-center">
          <img
            alt=""
            src={`${ASSETS}/rocket-window.svg`}
            className="size-[148.06px] max-w-none rotate-25"
          />
        </div>
        <div className="absolute top-[1722.48px] left-[142.15px] flex h-[167.261px] w-[104.009px] items-center justify-center">
          <img
            alt=""
            src={`${ASSETS}/rocket-porthole-shine.svg`}
            className="h-[167.448px] w-[36.679px] max-w-none rotate-25"
          />
        </div>
      </div>
    </div>
  );
}
