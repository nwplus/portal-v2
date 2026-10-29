import type { WrappedDoc } from "@/lib/firebase/types/wrapped";

/**
 * Development fixtures for the deck.
 *
 * The deck is driven entirely by one document, so the only thing standing between a
 * developer and every slide state is a plausible `WrappedDoc`. These variants exist to
 * exercise each gating branch in `buildSlides()` without seeding Firestore, and are
 * reachable only under `import.meta.env.DEV` via `?mock=<variant>` on the deck route.
 *
 * Not a substitute for the real path: the route reads Firestore first and only falls
 * back to these when the search param is present in a dev build.
 */

/** The 7 stamp clips; ids are the kebab-cased MOV filenames (`stamp-movs.ts`). */
const STAMPS = [
  {
    id: "prompt-to-prototype",
    name: "Prompt to Prototype",
    imgURL: "/assets/wrapped/stamps/prompt-to-prototype.png",
  },
  {
    id: "make-it-exist",
    name: "Make It Exist",
    imgURL: "/assets/wrapped/stamps/make-it-exist.png",
  },
  {
    id: "give-your-app-superpowers",
    name: "Give Your App Superpowers",
    imgURL: "/assets/wrapped/stamps/give-your-app-superpowers.png",
  },
  {
    id: "how-do-i-even-start",
    name: "How Do I Even Start",
    imgURL: "/assets/wrapped/stamps/how-do-i-even-start.png",
  },
  {
    id: "give-it-a-memory",
    name: "Give It a Memory",
    imgURL: "/assets/wrapped/stamps/give-it-a-memory.png",
  },
  {
    id: "behind-the-mind-of-a-product-designer",
    name: "Behind the Mind of a Product Designer",
    imgURL: "/assets/wrapped/stamps/behind-the-mind-of-a-product-designer.png",
  },
  {
    id: "vibe-responsibily",
    name: "Vibe Responsibily",
    imgURL: "/assets/wrapped/stamps/vibe-responsibily.png",
  },
];

/** Every slide qualifies — the longest deck the gating can produce. Ranks on lines. */
const full: WrappedDoc = {
  event: "HackCamp 2026",
  eventId: "HackCamp2026",
  generatedAt: "2026-11-14T02:00:00.000Z",
  name: "Robin",
  isFirstTimer: false,
  earlySubmission: 3.8,
  survival: 30.8,
  project: {
    title: "Moodloop",
    nugget: "A journal that turns your week into a playlist",
    githubTeamLineCount: 18452,
    githubLineCount: 7309,
    techStack: ["TypeScript", "React", "Firebase", "Claude"],
  },
  showedUp: { stamps: STAMPS, dayOfWorkshopCount: 3, preHackathonWorkshopCount: 2 },
  prize: ["Best Use of Firebase", "Hacker's Choice"],
  archetype: "THE_PRIZEWINNER",
  crossHackerComparison: {
    lines: { count: 7309, topPercentage: 0.3 },
    stamps: { count: 7, topPercentage: 12 },
    events: { count: 5, topPercentage: 18.4 },
    featured: "lines",
  },
  meals: 6,
  checkIn: true,
  summary: {
    event: "HackCamp 2026",
    projectName: "Moodloop",
    archetype: "THE_PRIZEWINNER",
    attendance: 5,
    stamps: STAMPS,
  },
};

/** No submission: drops `earlySubmission`, `nugget`, `github` and `techStack`. */
const noProject: WrappedDoc = {
  ...full,
  earlySubmission: null,
  project: null,
  prize: undefined,
  archetype: "THE_REGULAR",
  crossHackerComparison: { ...full.crossHackerComparison, lines: null, featured: "stamps" },
  summary: { ...full.summary, projectName: null, archetype: "THE_REGULAR" },
};

/** First hackathon: swaps `returning` for `firstTimer`. */
const firstTimer: WrappedDoc = {
  ...full,
  name: "Sam",
  isFirstTimer: true,
  prize: undefined,
  archetype: "THE_ORIGIN_STORY",
  summary: { ...full.summary, attendance: 1, archetype: "THE_ORIGIN_STORY" },
};

/** No `skills.github`: the GitHub slide shows the team count only, and lines aren't ranked. */
const noGithub: WrappedDoc = {
  ...full,
  project: full.project && { ...full.project, githubLineCount: null },
  crossHackerComparison: { ...full.crossHackerComparison, lines: null, featured: "stamps" },
};

/** Stamps beat lines, so the comparison follows the stamps slide. One stamp, for the singular copy. */
const comparisonStamps: WrappedDoc = {
  ...full,
  crossHackerComparison: {
    lines: { count: 7309, topPercentage: 15 },
    stamps: { count: 1, topPercentage: 10 },
    events: { count: 8, topPercentage: 5 },
    featured: "stamps",
  },
};

/** Neither lines nor stamps qualifies: events, after the attendance slide. */
const comparisonEvents: WrappedDoc = {
  ...full,
  crossHackerComparison: {
    lines: { count: 120, topPercentage: 62.5 },
    stamps: { count: 0, topPercentage: 88 },
    events: { count: 12, topPercentage: 2.4 },
    featured: "events",
  },
};

/** Nothing qualifies: no comparison slide. */
const noComparison: WrappedDoc = {
  ...full,
  crossHackerComparison: {
    lines: { count: 120, topPercentage: 62.5 },
    stamps: { count: 0, topPercentage: 88 },
    events: { count: 1, topPercentage: 71 },
    featured: null,
  },
};

/** The floor: intro, returning, origin, attendance, stamps, archetype, summary. */
const minimal: WrappedDoc = {
  ...noProject,
  survival: null,
  showedUp: { stamps: [], dayOfWorkshopCount: 0, preHackathonWorkshopCount: 0 },
  archetype: "THE_WARRIOR",
  crossHackerComparison: { lines: null, stamps: null, events: null, featured: null },
  meals: 0,
  checkIn: false,
  summary: { ...noProject.summary, archetype: "THE_WARRIOR", stamps: [] },
};

export const WRAPPED_FIXTURES = {
  full,
  "no-project": noProject,
  "first-timer": firstTimer,
  "no-github": noGithub,
  "comparison-stamps": comparisonStamps,
  "comparison-events": comparisonEvents,
  "no-comparison": noComparison,
  minimal,
} satisfies Record<string, WrappedDoc>;

export type WrappedFixtureName = keyof typeof WRAPPED_FIXTURES;

/**
 * Resolves a `?mock=` value to a fixture, in dev builds only.
 *
 * @param name - the raw search-param value
 * @returns the matching fixture, or null in production or when the name is unknown
 */
export function getWrappedFixture(name: string | undefined): WrappedDoc | null {
  if (!import.meta.env.DEV || !name) return null;
  return WRAPPED_FIXTURES[name as WrappedFixtureName] ?? null;
}
