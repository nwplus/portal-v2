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

/** Stand-in images from the summary art; real decks carry each stamp's `Stamps/{id}.imgURL`. */
const STAMPS = [
  { id: "first-commit", name: "First Commit", imgURL: "/assets/wrapped/summary/stamp-yellow.svg" },
  { id: "night-owl", name: "Night Owl", imgURL: "/assets/wrapped/summary/stamp-blue.svg" },
  { id: "team-player", name: "Team Player", imgURL: "/assets/wrapped/summary/stamp-pink.svg" },
  { id: "demo-time", name: "Demo Time", imgURL: "/assets/wrapped/summary/stamp-green.svg" },
  { id: "opening", name: "Opening Ceremony", imgURL: "/assets/wrapped/summary/stamp-purple.svg" },
];

/** Every slide qualifies — the longest deck the gating can produce. */
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
    githubTeamCommitCount: 412,
    githubCommitCount: 168,
    techStack: ["TypeScript", "React", "Firebase", "Claude"],
  },
  showedUp: { stamps: STAMPS, dayOfWorkshopCount: 3, preHackathonWorkshopCount: 2 },
  prize: ["Best Use of Firebase", "Hacker's Choice"],
  archetype: "THE_PRIZEWINNER",
  crossHackerComparison: { commitCount: 168, topPercentage: 4 },
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
  crossHackerComparison: null,
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

/** No `skills.github`: the GitHub slide shows the team count only. */
const noGithub: WrappedDoc = {
  ...full,
  project: full.project && { ...full.project, githubCommitCount: null },
  crossHackerComparison: null,
};

/** The floor: intro, returning, origin, attendance, stamps, archetype, summary. */
const minimal: WrappedDoc = {
  ...noProject,
  survival: null,
  showedUp: { stamps: [], dayOfWorkshopCount: 0, preHackathonWorkshopCount: 0 },
  archetype: "THE_WARRIOR",
  meals: 0,
  checkIn: false,
  summary: { ...noProject.summary, archetype: "THE_WARRIOR", stamps: [] },
};

export const WRAPPED_FIXTURES = {
  full,
  "no-project": noProject,
  "first-timer": firstTimer,
  "no-github": noGithub,
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
