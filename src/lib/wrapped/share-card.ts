import type { ArchetypeId, WrappedDoc } from "@/lib/firebase/types/wrapped";
import { ARCHETYPE_COPY, DEFAULT_ARCHETYPE } from "@/lib/wrapped/archetype-copy";

/**
 * What the shareable "Hacker Wrapped" image shows, read off the hacker's deck.
 *
 * Kept as one pure function over a `WrappedDoc` — no React — so every fallback is
 * testable in isolation; the card component only lays these strings out.
 */

/** Shown in place of a stat the hacker has no data for. */
export const MISSING_STAT = "—";

export interface ShareCardData {
  /** The event's display name, e.g. "HackCamp 2026" — the title's first line. */
  event: string;
  /** The hacker's own lines of code, e.g. "5,000"; `MISSING_STAT` without a readable repo. */
  linesShipped: string;
  linesLabel: string;
  /** The project's title; `MISSING_STAT` with no project. */
  projectName: string;
  archetype: ArchetypeId;
  archetypeLabel: string;
  /** Which nwPlus hackathon this was for the hacker, e.g. 10 + "th". */
  hackathonNumber: string;
  hackathonSuffix: string;
  stampCount: string;
  stampsLabel: string;
}

/** 1 → "st", 12 → "th", 23 → "rd". */
export function ordinalSuffix(n: number): string {
  const teen = n % 100 >= 11 && n % 100 <= 13;
  return teen ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
}

const formatCount = (n: number) => n.toLocaleString("en-US");

/**
 * Builds the share card's text for one hacker.
 *
 *  - lines shipped: `project.githubLineCount`, the hacker's own lines (not the team's)
 *  - project name: `project.title`
 *  - hackathon number: `summary.attendance`, which already counts this event
 *  - stamps: `summary.stamps`
 *
 * @param doc - the hacker's wrapped deck
 * @returns display-ready strings for the card
 */
export function buildShareCardData(doc: WrappedDoc): ShareCardData {
  const lines = doc.project?.githubLineCount ?? null;
  // At least 1: the hacker is at this event, whatever a stale doc says.
  const attendance = Math.max(1, Math.floor(doc.summary?.attendance ?? 1));
  const stamps = doc.summary?.stamps?.length ?? 0;
  // A membership check, as in `archetypeCopy`: the id can be stale or missing, and the
  // icon must match the label.
  const archetype = Object.hasOwn(ARCHETYPE_COPY, doc.archetype ?? "")
    ? doc.archetype
    : DEFAULT_ARCHETYPE;

  return {
    event: doc.event,
    linesShipped: lines === null ? MISSING_STAT : formatCount(lines),
    linesLabel: lines === 1 ? "Line of code shipped" : "Lines of code shipped",
    projectName: doc.project?.title?.trim() || MISSING_STAT,
    archetype,
    archetypeLabel: ARCHETYPE_COPY[archetype].label,
    hackathonNumber: String(attendance),
    hackathonSuffix: ordinalSuffix(attendance),
    stampCount: formatCount(stamps),
    stampsLabel: stamps === 1 ? "Stamp collected" : "Stamps collected",
  };
}

/** The filename the image saves under, e.g. "hackcamp-2026-hacker-wrapped.png". */
export function shareCardFileName(event: string): string {
  const slug = event
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "nwplus"}-hacker-wrapped.png`;
}
