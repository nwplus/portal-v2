import type { WrappedDoc } from "@/lib/firebase/types/wrapped";

/**
 * Which slides a given hacker sees.
 *
 * Kept as one pure function over a `WrappedDoc` — no React, no fetching — so the deck
 * order lives in exactly one place and every branch is testable in isolation.
 */

export type SlideId =
  | "intro"
  | "firstTimer"
  | "returning"
  | "earlySubmission"
  | "hackerOrigin"
  | "nugget"
  | "github"
  | "comparison"
  | "techStack"
  | "attendance"
  | "stamps"
  | "prizes"
  | "archetype"
  | "summary";

/** How each slide is named where the hacker picks slides, e.g. the share sheet. */
export const SLIDE_LABELS: Record<SlideId, string> = {
  intro: "Intro",
  firstTimer: "First hackathon",
  returning: "Returning hacker",
  earlySubmission: "Early submission",
  hackerOrigin: "Hacker origin",
  nugget: "Your project",
  github: "Lines committed",
  comparison: "Your ranking",
  techStack: "Tech stack",
  attendance: "Workshops",
  stamps: "Stamps collected",
  prizes: "Prizes won",
  archetype: "Your archetype",
  summary: "Thank you",
};

/** An early submission is only worth a slide if it beat the deadline by this much. */
const EARLY_SUBMISSION_MIN_HOURS = 1;

/**
 * Builds the ordered list of slides for one hacker.
 *
 * Conditions, in deck order:
 *  - `intro`            always
 *  - `firstTimer` /
 *    `returning`        exactly one of the two, branched on `isFirstTimer`
 *  - `earlySubmission`  beat the deadline by more than an hour
 *  - `hackerOrigin`     always — a static video with no per-hacker data
 *  - `nugget`           the project has a reviewed one-liner
 *  - `github`           the project has a readable repo (team line count)
 *  - `techStack`        the project lists at least one tool
 *  - `attendance`       always — zero workshops is still a number the comp can show
 *  - `stamps`           always
 *  - `comparison`       a featured stat (`crossHackerComparison.featured`, picked by the
 *                       script); right after that stat's own slide: `github` for lines,
 *                       `stamps` for stamps, `attendance` for events
 *  - `prizes`           won something
 *  - `archetype`        always
 *  - `summary`          always
 *
 * @param doc - the hacker's wrapped deck
 * @returns slide ids in render order
 */
export function buildSlides(doc: WrappedDoc): SlideId[] {
  const slides: SlideId[] = ["intro"];
  // Optional-chained: dev Firestore still holds docs from before the comparison had it.
  const featured = doc.crossHackerComparison?.featured ?? null;

  slides.push(doc.isFirstTimer ? "firstTimer" : "returning");

  if (doc.earlySubmission !== null && doc.earlySubmission > EARLY_SUBMISSION_MIN_HOURS) {
    slides.push("earlySubmission");
  }

  slides.push("hackerOrigin");

  if (doc.project?.nugget) {
    slides.push("nugget");
  }

  if (doc.project?.githubTeamLineCount != null) {
    slides.push("github");
    if (featured === "lines") slides.push("comparison");
  }

  if (doc.project && doc.project.techStack.length > 0) {
    slides.push("techStack");
  }

  slides.push("attendance");
  if (featured === "events") slides.push("comparison");

  slides.push("stamps");
  if (featured === "stamps") slides.push("comparison");

  if (doc.prize && doc.prize.length > 0) {
    slides.push("prizes");
  }

  slides.push("archetype", "summary");

  return slides;
}
