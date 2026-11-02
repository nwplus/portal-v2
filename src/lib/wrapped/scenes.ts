import type { ComparisonStat, WrappedDoc } from "@/lib/firebase/types/wrapped";
import type { LayerText } from "@/lib/wrapped/lottie";
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
  /** The clip, or a pick per hacker for clips with event branding baked in. */
  video: string | ((doc: WrappedDoc) => string);
  lottie?: string;
  texts?: (doc: WrappedDoc) => Record<string, LayerText>;
  /** Where a saved image's still is taken, as a fraction of the clip; the exporter's default otherwise. */
  stillAt?: number;
};

export type CodedScene = { kind: "coded" };

export type Scene = VideoScene | CodedScene;

/** The clip a video scene plays for this hacker. */
export function sceneVideo(scene: VideoScene, doc: WrappedDoc): string {
  return typeof scene.video === "function" ? scene.video(doc) : scene.video;
}

/** The comp has four tech-stack slots; unused ones are blanked rather than left as placeholders. */
const TECH_STACK_SLOTS = 4;

/** Rounds to one decimal place, dropping a trailing `.0`: hours, and the comparison's percentage. */
export function formatOneDecimal(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/**
 * The comparison comp's copy per featured stat. `\r` is After Effects' line break: the
 * caption's second line ("You were in the") and the category's two lines are the comp's.
 */
const COMPARISON_COPY: Record<
  ComparisonStat,
  { caption: (n: number) => string; category: string }
> = {
  lines: {
    caption: (n) => `You pushed ${n.toLocaleString()} ${n === 1 ? "line" : "lines"} of code.`,
    category: "Lines\rCommitted",
  },
  stamps: {
    caption: (n) => `You collected ${n.toLocaleString()} ${n === 1 ? "stamp" : "stamps"}.`,
    category: "Stamps\rCollected",
  },
  events: {
    caption: (n) => `You attended ${n.toLocaleString()} ${n === 1 ? "event" : "events"}.`,
    category: "Events\rAttended",
  },
};

/** The caption is 70px point text, so it never wraps: past this width it shrinks instead. */
const CAPTION_MAX_WIDTH = 982;
const CAPTION_SIZE = 70;
/** Hanken Grotesk 800's average advance per character in these captions, measured from the font. */
const CAPTION_EM_PER_CHAR = 0.48;

function captionSize(line: string): number {
  return Math.min(
    CAPTION_SIZE,
    Math.floor(CAPTION_MAX_WIDTH / (line.length * CAPTION_EM_PER_CHAR)),
  );
}

export const SCENES: Record<SlideId, Scene> = {
  intro: { kind: "coded" },
  firstTimer: {
    kind: "video",
    // The event badge is baked into the clip. HackCamp's render has the HackCamp mark in
    // place of nwHacks'; other events keep the nwHacks badge until they get their own.
    video: (doc) =>
      doc.eventId.toLowerCase().startsWith("hackcamp")
        ? `${ASSETS}/first-timer/first-timer-hackcamp.mp4`
        : `${ASSETS}/first-timer/first-timer.mp4`,
  },
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
  comparison: {
    kind: "video",
    video: `${ASSETS}/cross-hacker/cross-hacker-bg.mp4`,
    lottie: `${ASSETS}/cross-hacker/cross-hacker.json`,
    // The category types itself in until frame 89 of 90, so the still waits for it; not 1,
    // since seeking to the very end of a clip isn't reliable everywhere.
    stillAt: 0.99,
    // Which stat is shown is the script's call (`featured`); buildSlides only includes this
    // slide when there is one.
    texts: (doc): Record<string, LayerText> => {
      const { featured } = doc.crossHackerComparison;
      const stat = featured ? doc.crossHackerComparison[featured] : null;
      if (!featured || !stat) return {};
      const line = COMPARISON_COPY[featured].caption(stat.count);
      return {
        ".caption": { text: `${line}\rYou were in the`, size: captionSize(line) },
        ".comparison": `${formatOneDecimal(stat.topPercentage)}%`,
        ".category": COMPARISON_COPY[featured].category,
      };
    },
  },
  prizes: {
    kind: "video",
    video: `${ASSETS}/prizes/prizes-won-bg.mp4`,
    lottie: `${ASSETS}/prizes/prizes-won.json`,
    texts: (doc) => ({ ".prizeNo": String(doc.prize?.length ?? 0) }),
  },
  archetype: { kind: "coded" },
  summary: { kind: "coded" },
};
