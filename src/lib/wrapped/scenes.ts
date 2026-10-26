import type { WrappedDoc } from "@/lib/firebase/types/wrapped";
import type { SlideId } from "@/lib/wrapped/slides";

/**
 * What each slide plays, and which of the hacker's numbers go into it.
 *
 * Video slides are an mp4 with an optional After Effects text layer on top; `texts` maps
 * that comp's layer names to the hacker's values. Coded slides render their own data.
 * Whether a slide is in the deck at all is `buildSlides()`'s call, not this file's.
 */

const ASSETS = "/assets/wrapped";

export type VideoScene = {
  kind: "video";
  video: string;
  lottie?: string;
  texts?: (doc: WrappedDoc) => Record<string, string>;
};

export type CodedScene = { kind: "coded" };

export type Scene = VideoScene | CodedScene;

/** The comp has four tech-stack slots; unused ones are blanked rather than left as placeholders. */
const TECH_STACK_SLOTS = 4;

/** Rounds to one decimal place, dropping a trailing `.0`: hours, and the comparison's percentage. */
export function formatOneDecimal(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export const SCENES: Record<SlideId, Scene> = {
  intro: { kind: "coded" },
  firstTimer: { kind: "video", video: `${ASSETS}/first-timer/first-timer.mp4` },
  returning: { kind: "video", video: `${ASSETS}/returning-hacker/returning-hacker.mp4` },
  earlySubmission: {
    kind: "video",
    video: `${ASSETS}/early-submission/early-submission-bg.mp4`,
    lottie: `${ASSETS}/early-submission/early-submission.json`,
    // `\r` is After Effects' line break, matching the comp's two-line placeholder.
    texts: (doc) => ({
      "You submitted 10 hours early!": `You submitted ${formatOneDecimal(doc.earlySubmission ?? 0)}\rhours early!`,
    }),
  },
  hackerOrigin: { kind: "video", video: `${ASSETS}/hacker-origin/hacker-origin.mp4` },
  nugget: {
    kind: "video",
    video: `${ASSETS}/nugget/project-descriptoins-bg.mp4`,
    lottie: `${ASSETS}/nugget/data.json`,
    texts: (doc) => ({ "this project is so cool": doc.project?.nugget ?? "" }),
  },
  github: {
    kind: "video",
    video: `${ASSETS}/github-metrics/github-metrics-bg.mp4`,
    lottie: `${ASSETS}/github-metrics/github-metrics.json`,
    // Lines committed: team first, then this hacker's own — blank when there's no GitHub
    // username to attribute lines to, never a team number standing in for a personal one.
    texts: (doc) => ({
      "10000": (doc.project?.githubTeamLineCount ?? 0).toLocaleString(),
      "10001": doc.project?.githubLineCount?.toLocaleString() ?? "",
    }),
  },
  techStack: {
    kind: "video",
    video: `${ASSETS}/tech-stack/tech-stack-base.mp4`,
    lottie: `${ASSETS}/tech-stack/tech-stack-text-new.json`,
    texts: (doc) => {
      const stack = doc.project?.techStack ?? [];
      return Object.fromEntries(
        Array.from({ length: TECH_STACK_SLOTS }, (_, i) => [`techStack${i + 1}`, stack[i] ?? ""]),
      );
    },
  },
  attendance: {
    kind: "video",
    video: `${ASSETS}/attendance/attendance-bg.mp4`,
    lottie: `${ASSETS}/attendance/attendance.json`,
    texts: (doc) => ({
      ".preHackathonWorkshops": String(doc.showedUp.preHackathonWorkshopCount),
      ".dayOfWorkshops": String(doc.showedUp.dayOfWorkshopCount),
    }),
  },
  stamps: { kind: "coded" },
  comparison: { kind: "coded" },
  prizes: {
    kind: "video",
    video: `${ASSETS}/prizes/prizes-won-bg.mp4`,
    lottie: `${ASSETS}/prizes/prizes-won.json`,
    texts: (doc) => ({ ".prizeNo": String(doc.prize?.length ?? 0) }),
  },
  archetype: { kind: "coded" },
  summary: { kind: "coded" },
};
