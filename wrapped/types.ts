/**
 * Data shapes for the Wrapped script, in the order data flows through a write run:
 *
 *   raw (cached fetches) -> extracted (per hacker / per project) -> stage outputs -> WrappedDoc
 *
 * See README.md "Field graph" for which function turns which field into which.
 * `TODO(Qn)` refers to the open questions in README.md.
 */

// ---------------------------------------------------------------------------
// Run control
// ---------------------------------------------------------------------------

export type Env = "dev" | "prod";

export type Mode = "write" | "prize" | "stats" | "delete";

/** Write-run stages, in execution order. */
export const STAGES = ["fetch", "match", "enrich", "assemble", "write"] as const;
export type Stage = (typeof STAGES)[number];

/** The three mid-run restart points. */
export const CHECKPOINTS = ["match", "enrich", "assemble"] as const satisfies readonly Stage[];
export type Checkpoint = (typeof CHECKPOINTS)[number];

/**
 * What `--from` accepts: the checkpoints, plus `fetch` (everything) and `write`
 * (clear the ledger and rewrite every doc from the last assemble).
 */
export type RestartPoint = "fetch" | Checkpoint | "write";

export type StageStatus = "pending" | "running" | "done" | "skipped";

/**
 * Bumped when a stage output's shape changes, so a later stage refuses a stale one instead
 * of writing old-shape docs. Carried by EnrichOutput and AssembleOutput; absent means 1.
 */
export const STAGE_SCHEMA_VERSION = 2;

/** `cache/{env}/{eventId}/progress.json` */
export interface Progress {
  eventId: string;
  env: Env;
  updatedAt: string;
  stages: Record<
    Stage,
    {
      status: StageStatus;
      startedAt?: string;
      finishedAt?: string;
      /** Live counter for the stage's progress bar. */
      done?: number;
      total?: number;
    }
  >;
  /** UIDs already committed to Firestore, so an interrupted write resumes. */
  writtenUids: string[];
}

// ---------------------------------------------------------------------------
// Raw inputs: cached as fetched, with Timestamps converted to ISO strings
// ---------------------------------------------------------------------------

/** Event-level values the calculations need. */
export interface EventInfo {
  eventId: string;
  /** CONFIG.eventName, e.g. "HackCamp 2026". */
  name: string;
  /** `Hackathons/{eventId}.wrapped.hackathonStart`. Start of the commit window. */
  hackathonStart: string;
  /**
   * `Hackathons/{eventId}.wrapped.hackathonEnd`. End of the commit window, the
   * submission deadline, and the end of `survival`.
   */
  hackathonEnd: string;
  /** `wrapped.checkInOpensAt` if set, else null (earliest check-in is used). Q20. */
  checkInOpensAt: string | null;
}

/** The fields read from `Hackathons/{eventId}/Applicants/{uid}`. */
export interface RawApplicant {
  uid: string;
  basicInfo: {
    email: string;
    preferredName?: string;
    legalFirstName?: string;
  };
  skills?: {
    /** "https://github.com/{username}"; null or absent for many hackers. */
    github?: string | null;
  };
  dayOf?: {
    checkedIn?: boolean;
    /** Written by the scanner as `Date.toString()`; older data holds a Timestamp (ISO here). */
    checkedInTime?: string;
    /** Meal slot -> scan times. Hand-edited rows sometimes hold a non-array; ignored. */
    day1?: Record<string, unknown>;
    day2?: Record<string, unknown>;
    /** Every day-of scan (workshops, mini-events, ...), typed via `DayOf` (Q11d). */
    events?: Array<{ eventId?: string }>;
  };
  /** Pre-hackathon workshop scans; `eventId` is a `PreHackathonWorkshops` doc id (Q1). */
  preDayOf?: { events?: Array<{ eventId?: string }> };
}

/** `Hackathons/{eventId}/DayOf/{id}` */
export interface RawDayOfItem {
  id: string;
  /** "workshops" | "minievents" | ... */
  type: string;
}

/**
 * One doc of the top-level `Attendance` collection: one per (hacker, hackathon), for
 * the lifetime count only. May include this event, so callers exclude it (Q5).
 */
export interface RawAttendance {
  uid: string;
  hackathonId: string;
}

/** `Stamps/{id}` where `hackathon == eventId`. Socials stores these ids (Q7). */
export interface RawStamp {
  id: string;
  name: string;
  imgURL?: string;
  description?: string;
}

/** A stamp as written to the Wrapped doc. */
export interface WrappedStamp {
  id: string;
  name: string;
  imgURL: string | null;
}

/** `Hackathons/{eventId}/PreHackathonWorkshops/{id}` (Q1). */
export interface RawPreHackathonWorkshop {
  id: string;
  name: string;
}

/** One `award_placement` row from the judging portal (Supabase), joined to its award and project. */
export interface RawAwardPlacement {
  award: string;
  placement: number | null;
  projectName: string;
  devpostUrl: string | null;
}

/** The fields read from `Socials/{uid}`. */
export interface RawSocial {
  uid: string;
  email?: string;
  unlockedStamps?: Record<string, string[]>;
  /** Only an explicit `false` opts out; absent means included. */
  hackerWrappedOptIn?: boolean;
}

/** One Devpost CSV row, normalized. TODO(Q17): column names unverified. */
export interface DevpostRow {
  /** Devpost submission URL, used as the project id. Format unverified. */
  submissionUrl: string;
  title: string;
  techStack: string[];
  /** "About The Project"; input to Nugget's message (NUGGET.md). */
  about: string;
  /** "Try it out" links; GitHub repo URLs are picked out of these. */
  tryItOutLinks: string[];
  /** Submitter plus team member emails, lowercased. */
  memberEmails: string[];
}

export interface RepoRef {
  owner: string;
  repo: string;
}

/** One commit from `GET /repos/{owner}/{repo}/commits`. */
export interface RawCommit {
  sha: string;
  /** Committer date, not author date: when the commit landed, which survives rebases. */
  committedAt: string;
  message: string;
  /** Null when the commit email isn't linked to a GitHub account. */
  authorLogin: string | null;
  /** "User" | "Bot"; bots are excluded from counts and feed AI detection. */
  authorType: string | null;
}

/** raw/github-commits/{sha}.json, from `GET /repos/{owner}/{repo}/commits/{sha}`. Null: unreadable. */
export interface RawCommitDetail {
  /** More than 1 is a merge, which adds no lines (Q9). */
  parentCount: number;
  /** Every page of the file list. Binary files report 0 additions. */
  files: Array<{ filename: string; additions: number }>;
}

// ---------------------------------------------------------------------------
// Stage outputs: cache/{env}/{eventId}/stages/{stage}.json
// ---------------------------------------------------------------------------

/** Everything the doc needs that comes straight from Firestore, one per hacker. */
export interface Hacker {
  uid: string;
  /** Applicant email first, then the Socials email if different. Lowercased. */
  emails: string[];
  /** Lowercased username from skills.github. Null: no GitHub section for this hacker. */
  githubLogin: string | null;
  name: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  mealCount: number;
  /** `dayOf.day1.snack` scanned. Archetype input only. */
  claimedMidnightSnack: boolean;
  dayOfWorkshopCount: number;
  /** Archetype input only (THE_REGULAR). From `dayOf.events` (Q11d). */
  miniEventCount: number;
  preHackathonWorkshopCount: number;
  stamps: WrappedStamp[];
  lifetimeEventCount: number;
}

export interface FetchOutput {
  event: EventInfo;
  hackers: Hacker[];
  /** Opted-out hackers' emails, so the match report doesn't list them as unmatched. */
  optedOutEmails: string[];
  devpostRows: DevpostRow[];
}

export interface Project {
  /** The Devpost submission URL. */
  id: string;
  title: string;
  techStack: string[];
  about: string;
  repos: RepoRef[];
  memberUids: string[];
  /** max(matched uids, listed emails). THE_LONE_WOLF input. */
  teamSize: number;
  /** Emails on the row that matched no hacker. */
  unmatchedEmails: string[];
}

/** Hand-written corrections, `cache/{env}/{eventId}/overrides.json`. Survives re-runs. */
export interface MatchOverrides {
  /** Devpost email -> uid, for hackers who used a different email on Devpost. */
  emailToUid: Record<string, string>;
  /** uid -> project id, or null to detach a hacker from every project. */
  uidToProject: Record<string, string | null>;
}

export interface MatchOutput {
  /** Rows with at least one matched hacker. Orphan rows are only in the report. */
  projects: Project[];
  /** uid -> project id. A hacker absent here has no project. */
  projectByUid: Record<string, string>;
  /** uid -> every project id the hacker's emails matched, when more than one (Q14). */
  conflicts: Record<string, string[]>;
}

/** Nugget's reactions (NUGGET.md). CURIOUS is the fallback, always a candidate. */
export const NUGGET_PATHS = [
  "IMPRESSED",
  "FUN",
  "NICHE_DETAIL",
  "HEARTFELT",
  "CLUTCH",
  "EARLY_CALM",
  "SOLO",
  "AI_SIDEKICK",
  "CURIOUS",
] as const;
export type NuggetPath = (typeof NUGGET_PATHS)[number];

/** Deterministic per-project facts that gate the metadata paths. */
export interface NuggetSignals {
  solo: boolean;
  /** lastCommitAt within an hour of hackathonEnd. */
  clutch: boolean;
  /** lastCommitAt 3 or more hours before hackathonEnd. */
  earlyCalm: boolean;
  /** An AI tool or LLM API in Built With, or detected by detectAiTools. */
  aiStack: boolean;
  /** 5 or more Built With entries, or team commits in the top quartile. */
  impressed: boolean;
}

/** What the model sees for one project. Its hash decides whether a stored message is reused. */
export interface NuggetInput {
  title: string;
  /** Cleaned About text, capped. */
  about: string;
  builtWith: string[];
  teamSize: number;
  signals: NuggetSignals;
}

/**
 * One project's entry in `cache/{env}/{eventId}/nuggets.json`. Ignores bypassCache, so a
 * re-pull never discards review. Regenerated only when promptVersion or inputHash changes,
 * or when the entry is deleted by hand.
 */
export interface NuggetEntry {
  path: NuggetPath | null;
  /** Null: generation failed, or blanked in review (the slide is hidden). */
  message: string | null;
  source: "llm" | "override" | "failed";
  /** Soft-check warnings, or why generation failed. Shown in review. */
  flags: string[];
  promptVersion: number;
  inputHash: string;
  reviewed: boolean;
  createdAt: string;
}

/** projectId -> entry. */
export type NuggetStore = Record<string, NuggetEntry>;

/** One row of `output/nugget-review.json`. Organizers edit `message`; blank hides the slide. */
export interface NuggetReviewItem {
  projectId: string;
  title: string;
  path: NuggetPath | null;
  message: string;
  source: NuggetEntry["source"];
  reviewed: boolean;
  flags: string[];
  about: string;
  /** The entry's createdAt: a rerun keeps edits made against this generation only. */
  generatedAt: string;
}

export interface ProjectEnrichment {
  projectId: string;
  /** Commits in [hackathonStart, hackathonEnd] across the project's repos, bots excluded. Null with no readable repo. */
  teamCommitCount: number | null;
  /** uid -> commits whose author login is that hacker's githubLogin. */
  commitsByUid: Record<string, number>;
  unattributedCommitCount: number;
  /**
   * Additions across the same commits, merges and excluded files dropped (countCommitLines).
   * Null with no readable repo, like teamCommitCount.
   */
  teamLineCount: number | null;
  /** uid -> lines of that hacker's commits, attributed like commitsByUid. */
  linesByUid: Record<string, number>;
  /** Counted commits whose stats GitHub wouldn't return (422 etc.); they add 0 lines. */
  unreadableCommitStats: number;
  /**
   * Latest in-window commit across the project's repos. Stands in for the submission
   * time: earlySubmission, THE_SPEEDRUNNER, THE_FINISHER.
   */
  lastCommitAt: string | null;
  /** Appended to the project's techStack in the doc. */
  aiTools: string[];
  /** Nugget's reviewed one-liner (NUGGET.md). Null: empty About text, or blanked in review. */
  nugget: string | null;
}

export interface EnrichOutput {
  /** STAGE_SCHEMA_VERSION when written; absent means 1. */
  schemaVersion?: number;
  byProject: Record<string, ProjectEnrichment>;
}

export interface AssembleOutput {
  /** STAGE_SCHEMA_VERSION when written; absent means 1. */
  schemaVersion?: number;
  docs: Record<string, WrappedDoc>;
}

// ---------------------------------------------------------------------------
// Output: Hackathons/{eventId}/Wrapped/{uid}
// ---------------------------------------------------------------------------

/** Must match `ArchetypeId` in src/lib/firebase/types/wrapped.ts. In priority order. */
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

/** The stats the cross-hacker comparison ranks. */
export type ComparisonStat = "lines" | "stamps" | "events";

/** One stat ranked against its cohort. */
export interface RankedStat {
  /** The hacker's own count, copied on purpose. */
  count: number;
  /** ceil(1000 × (hackers with strictly more + 1) / cohort size) / 10. */
  topPercentage: number;
}

export interface WrappedDoc {
  /** Display name, e.g. "HackCamp 2026". */
  event: string;
  eventId: string;
  generatedAt: string;
  name: string;
  isFirstTimer: boolean;
  /**
   * Hours (one decimal) from the project's lastCommitAt to hackathonEnd. Never negative
   * (later commits are outside the window). Null with no project or no readable repo.
   */
  earlySubmission: number | null;
  /** Hours (one decimal) from checkedInAt to hackathonEnd. Null if not checked in. */
  survival: number | null;
  /** Null with no project. */
  project: {
    title: string;
    /** Nugget's one-liner on the project, ≤ 80 chars. Null hides the slide. */
    nugget: string | null;
    /**
     * Was githubTeamCommitCount. In-window additions across the team's repos; bots, merges
     * and excluded files dropped. Team stat: shown even when this hacker has no
     * skills.github (Q21). Null with no readable repo.
     */
    githubTeamLineCount: number | null;
    /** Was githubCommitCount. This hacker's lines. Null without skills.github (Q21). */
    githubLineCount: number | null;
    /** Devpost "Built With" plus detected AI tools. */
    techStack: string[];
  } | null;
  showedUp: {
    stamps: WrappedStamp[];
    dayOfWorkshopCount: number;
    preHackathonWorkshopCount: number;
  };
  /** Written only by the prize run. `write` carries an existing value over. */
  prize?: string[];
  /** THE_PRIZEWINNER only via applyPrizes; `write` assigns everything below it. */
  archetype: ArchetypeId;
  /**
   * Each stat ranked against its cohort (Q10); null outside it. Lines: hackers with a
   * githubLineCount. Stamps and events: checked-in hackers.
   */
  crossHackerComparison: {
    lines: RankedStat | null;
    stamps: RankedStat | null;
    events: RankedStat | null;
    /** The stat the comparison slide shows; null hides the slide. */
    featured: ComparisonStat | null;
  };
  /** Meal slots with at least one scan, max 7 (Q18). */
  meals: number;
  checkIn: boolean;
  /** Copies fields above on purpose. */
  summary: {
    event: string;
    projectName: string | null;
    archetype: ArchetypeId;
    /** Lifetime events including this one: countLifetimeEvents + 1. */
    attendance: number;
    stamps: WrappedStamp[];
  };
}

// ---------------------------------------------------------------------------
// Organizer statistics: Hackathons/{eventId}/WrappedStats
// ---------------------------------------------------------------------------

/**
 * One hacker's telemetry at `WrappedStats/{uid}`, written by the Portal. Must match
 * `WrappedStatsSession` in src/lib/firebase/types/wrapped.ts. A doc exists only once
 * the hacker has opened their deck.
 */
export interface WrappedStatsSession {
  opened: boolean;
  completed: boolean;
  shareClicked: boolean;
}

/** `WrappedStats/Summary`, written by the stats run and read by organizers. */
export interface WrappedStatsSummary {
  eventId: string;
  /** `count()` of the `Wrapped` collection: the open-rate denominator. */
  numberOfHackers: number;
  opens: number;
  completions: number;
  shares: number;
  /** `opens / numberOfHackers`, three decimals. */
  openRate: number;
  completionRate: number;
  shareRate: number;
  /** ISO string, like every other timestamp this script writes. */
  lastAggregatedAt: string;
}
