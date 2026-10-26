/**
 * The PUBLISHED half of the Hacker Wrapped contract — the shape the batch script
 * writes and the Portal reads.
 *
 * This lives in `src/` rather than `wrapped/` because `wrapped/` is Node-targeted and
 * excluded from the root tsconfig, so the app cannot import from it. `ArchetypeId`,
 * `WrappedStamp`, `ComparisonStat`, `RankedStat` and `WrappedDoc` mirror `wrapped/types.ts`
 * — keep them in sync.
 *
 * All timestamps are ISO 8601 strings, never `Timestamp` objects — the script runs on
 * `firebase-admin/firestore` while the app runs on the client SDK, and the two classes
 * are structurally similar but not the same type.
 *
 * Nullable fields are written as literal `null` rather than omitted, so the frontend
 * branches on presence without optional-key guards.
 */

// ---------------------------------------------------------------------------
// Archetypes
// ---------------------------------------------------------------------------

/**
 * The archetype ids, in rule order — the order is the priority, so a prizewinning
 * veteran gets THE_PRIZEWINNER.
 *
 * The doc carries only this id. Label, description and the "why you got this" copy
 * live in the frontend keyed by id (`src/lib/wrapped/archetype-copy.ts`), so wording
 * can change without a re-run. `ANCHOR` keeps the article-less form its label has
 * always had.
 */
export type ArchetypeId =
  | "THE_PRIZEWINNER"
  | "THE_VETERAN"
  | "ANCHOR"
  | "THE_LONE_WOLF"
  | "THE_SPEEDRUNNER"
  | "THE_EARLY_BIRD"
  | "THE_FINISHER"
  | "THE_NIGHT_OWL"
  | "THE_ORIGIN_STORY"
  | "THE_REGULAR"
  | "THE_WARRIOR";

// ---------------------------------------------------------------------------
// The deck
// ---------------------------------------------------------------------------

/** A stamp as written to the Wrapped doc. */
export interface WrappedStamp {
  id: string;
  name: string;
  imgURL: string | null;
}

/** The stats the cross-hacker comparison ranks. */
export type ComparisonStat = "lines" | "stamps" | "events";

/** One stat ranked against its cohort. */
export interface RankedStat {
  /** The hacker's own count, copied on purpose. */
  count: number;
  /** ceil(1000 × (hackers with strictly more + 1) / cohort size) / 10, so one decimal. */
  topPercentage: number;
}

/**
 * The doc written to `Hackathons/{event}/Wrapped/{uid}` by `wrapped/`. Owner-read only.
 *
 * Mirrors `WrappedDoc` in `wrapped/types.ts` field for field — change both together.
 *
 * Release is NOT a field here — it is `Hackathons/{event}.wrapped.isReady`.
 */
export interface WrappedDoc {
  /** Display name, e.g. "HackCamp 2026". */
  event: string;
  eventId: string;
  generatedAt: string;
  name: string;
  isFirstTimer: boolean;
  /**
   * Hours (one decimal) from the project's lastCommitAt to hackathonEnd. Never negative.
   * Null with no project or no readable repo.
   */
  earlySubmission: number | null;
  /** Hours (one decimal) from checkedInAt to hackathonEnd. Null if not checked in. */
  survival: number | null;
  /** Null with no project. */
  project: {
    title: string;
    /** Nugget's one-liner on the project, <= 80 chars. Null hides the slide. */
    nugget: string | null;
    /**
     * Was githubTeamCommitCount. In-window additions across the team's repos; bots, merges
     * and excluded files dropped. Team stat. Null with no readable repo.
     */
    githubTeamLineCount: number | null;
    /** Was githubCommitCount. This hacker's lines. Null without `skills.github`. */
    githubLineCount: number | null;
    /** Devpost "Built With" plus detected AI tools. */
    techStack: string[];
  } | null;
  showedUp: {
    stamps: WrappedStamp[];
    dayOfWorkshopCount: number;
    preHackathonWorkshopCount: number;
  };
  /** Written only by the prize run. */
  prize?: string[];
  archetype: ArchetypeId;
  /**
   * Each stat ranked against its cohort; null outside it. Lines: hackers with a
   * githubLineCount. Stamps and events: checked-in hackers.
   */
  crossHackerComparison: {
    lines: RankedStat | null;
    stamps: RankedStat | null;
    events: RankedStat | null;
    /** The stat the comparison slide shows; null hides the slide. */
    featured: ComparisonStat | null;
  };
  /** Meal slots with at least one scan, max 7. */
  meals: number;
  checkIn: boolean;
  /** Copies fields above on purpose. */
  summary: {
    event: string;
    projectName: string | null;
    archetype: ArchetypeId;
    /** Lifetime events including this one. */
    attendance: number;
    stamps: WrappedStamp[];
  };
}

/**
 * The slim public card at top-level `WrappedShares/{shareId}` — world-readable, read by
 * `/wrapped/view/{shareId}`.
 *
 * Derived from the finished `WrappedDoc` rather than assembled in parallel, so it
 * cannot drift from it. Carries no uid, email, teammates, or emails of any kind — that
 * boundary is the reason this type is separate, so never widen it toward `WrappedDoc`.
 */
export interface WrappedShareCard {
  schemaVersion: 1;
  eventId: string;
  preferredName: string;
  archetype: ArchetypeId;
  /** Headline numbers only, all derivable from the deck. */
  stats: {
    projectTitle: string | null;
    mealCount: number;
    workshopCount: number;
    miniEventCount: number;
    stampCount: number;
    prizes: string[];
  };
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Organizer statistics
// ---------------------------------------------------------------------------

/**
 * One hacker's telemetry, written by the Portal to
 * `Hackathons/{event}/WrappedStats/{uid}` — four segments, a document.
 *
 * A doc is written only when a hacker opens their deck, so "no doc" means "never
 * opened" and counts toward the open-rate denominator (the number of decks generated)
 * without being a gap. Never pre-create one.
 */
export interface WrappedStatsSession {
  opened: boolean;
  completed: boolean;
  shareClicked: boolean;
}

/*
 * The matching aggregate, `WrappedStatsSummary` at
 * `Hackathons/{event}/WrappedStats/Summary`, deliberately does NOT live here: the
 * Portal never reads it. It is written by the batch script and read by organizers, so
 * it is defined in `wrapped/types.ts`.
 */
