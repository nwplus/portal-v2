import type { ArchetypeId, WrappedDoc } from "@/lib/firebase/types/wrapped";
import { ARCHETYPE_COPY, DEFAULT_ARCHETYPE } from "@/lib/wrapped/archetype-copy";
import { textWidth } from "@/lib/wrapped/text-width";

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

/** The project name's box. */
export const PROJECT_NAME_WIDTH = 460;
const PROJECT_NAME_WEIGHT = 600;
/**
 * Sizes for the project name, largest first. The space under the code window holds two lines
 * of 48px, which is also three of 32px.
 */
const PROJECT_NAME_FITS = [
  { size: 48, lines: 2 },
  { size: 40, lines: 2 },
  { size: 32, lines: 3 },
] as const;

/** How many lines `name` wraps to at `size`: word by word, as the browser fills the box. */
function wrappedLines(name: string, size: number): number {
  const width = (text: string) => textWidth(text, size, PROJECT_NAME_WEIGHT);
  let lines = 0;
  let line = "";
  for (const word of name.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (width(next) <= PROJECT_NAME_WIDTH) {
      line = next;
      continue;
    }
    if (line) lines++;
    if (width(word) <= PROJECT_NAME_WIDTH) {
      line = word;
    } else {
      // A word wider than the box breaks mid-word, taking a line per box width.
      lines += Math.ceil(width(word) / PROJECT_NAME_WIDTH);
      line = "";
    }
  }
  return lines + (line ? 1 : 0);
}

/**
 * The largest size that shows the whole project name on the card. A name too long even for
 * the smallest stays there, for the clamp to cut.
 */
export function projectNameFit(name: string): { size: number; lines: number } {
  return (
    PROJECT_NAME_FITS.find((fit) => wrappedLines(name, fit.size) <= fit.lines) ??
    PROJECT_NAME_FITS[PROJECT_NAME_FITS.length - 1]
  );
}

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
