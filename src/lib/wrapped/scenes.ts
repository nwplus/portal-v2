import type { ComparisonStat, WrappedDoc } from "@/lib/firebase/types/wrapped";
import type { LayerText } from "@/lib/wrapped/lottie";
import type { SlideId } from "@/lib/wrapped/slides";
import { fitTechStack } from "@/lib/wrapped/tech-stack";

/**
 * What each slide plays, and which of the hacker's numbers go into it.
 *
 * Video slides are an mp4 with an optional After Effects text layer on top; `texts` maps
 * that comp's layer names to the hacker's values. Coded slides render their own data.
 * Whether a slide is in the deck at all is `buildSlides()`'s call, not this file's.
 */

/** Lottie comps and images, served from `public/`. */
const ASSETS = "/assets/wrapped";

/**
 * Where the clips live in Firebase Storage, under the bucket the build is configured for (dev or
 * prod). They're too heavy for git and Hosting, so they're compressed and uploaded separately:
 * `pnpm wrapped:compress --crf 24 --fps 30 --no-ssim --out public/assets/wrapped/compressed`,
 * then copy `compressed/crf-24-30fps/*` to this folder. Objects are cached as immutable, so a
 * re-encode goes to a new version folder (`v3`) rather than overwriting this one.
 */
const CLIPS = "hackerWrapped/v2";

/** A clip's public URL. Public read on `hackerWrapped/` is granted in the Storage rules. */
function clip(file: string): string {
  const bucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(`${CLIPS}/${file}`)}?alt=media`;
}

export type VideoScene = {
  kind: "video";
  /** The clip, or a pick per hacker for clips with event branding baked in. */
  video: string | ((doc: WrappedDoc) => string);
  lottie?: string;
  texts?: (doc: WrappedDoc) => Record<string, LayerText>;
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
        ? clip("first-timer/first-timer-hackcamp.mp4")
        : clip("first-timer/first-timer.mp4"),
  },
  returning: { kind: "video", video: clip("returning-hacker/returning-hacker.mp4") },
  earlySubmission: {
    kind: "video",
    video: clip("early-submission/early-submission-bg.mp4"),
    lottie: `${ASSETS}/early-submission/early-submission.json`,
    // `\r` is After Effects' line break, matching the comp's two-line placeholder.
    texts: (doc) => ({
      "You submitted 10 hours early!": `You submitted ${formatOneDecimal(doc.earlySubmission ?? 0)}\rhours early!`,
    }),
  },
  hackerOrigin: { kind: "video", video: clip("hacker-origin/hacker-origin.mp4") },
  github: {
    kind: "video",
    video: clip("github/github-metrics-bg.mp4"),
    lottie: `${ASSETS}/github/github-metrics.json`,
    // Lines committed: team first, then this hacker's own. With no GitHub username to
    // attribute lines to, or none of the team's lines under it (only merges, or commits from
    // an email not linked to their account), the personal line goes entirely, never a team
    // number or a 0 standing in.
    texts: (doc) => {
      const own = doc.project?.githubLineCount;
      return {
        "10000": (doc.project?.githubTeamLineCount ?? 0).toLocaleString(),
        ...(own == null || own === 0
          ? { "10001": "", ".youCommitted": "", ".youLines": "" }
          : { "10001": own.toLocaleString() }),
      };
    },
  },
  techStack: {
    kind: "video",
    video: clip("tech-stack/tech-stack-base.mp4"),
    lottie: `${ASSETS}/tech-stack/tech-stack-text-new.json`,
    texts: (doc) => {
      const { names, layerSize } = fitTechStack(doc.project?.techStack ?? [], TECH_STACK_SLOTS);
      return Object.fromEntries(
        Array.from({ length: TECH_STACK_SLOTS }, (_, i): [string, LayerText] => [
          `techStack${i + 1}`,
          names[i] ? { text: names[i], size: layerSize } : "",
        ]),
      );
    },
  },
  attendance: {
    kind: "video",
    video: clip("attendance/attendance-bg.mp4"),
    lottie: `${ASSETS}/attendance/attendance.json`,
    texts: (doc) => ({
      ".preHackathonWorkshops": String(doc.showedUp.preHackathonWorkshopCount),
      ".dayOfWorkshops": String(doc.showedUp.dayOfWorkshopCount),
    }),
  },
  stamps: { kind: "coded" },
  comparison: {
    kind: "video",
    video: clip("cross-hacker/cross-hacker-bg.mp4"),
    lottie: `${ASSETS}/cross-hacker/cross-hacker.json`,
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
    video: clip("prizes/prizes-won-bg.mp4"),
    lottie: `${ASSETS}/prizes/prizes-won.json`,
    texts: (doc) => ({ ".prizeNo": String(doc.prize?.length ?? 0) }),
  },
  archetype: { kind: "coded" },
  summary: { kind: "coded" },
};
