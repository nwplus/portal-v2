/**
 * Every external read. Each function goes through `ctx.cache.raw`, so a re-run costs
 * no network unless `bypassCache` is set. Nothing here derives fields; see calc.ts.
 */

import fs from "node:fs/promises";

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { Timestamp } from "firebase-admin/firestore";
import type { DocumentData } from "firebase-admin/firestore";
import Papa from "papaparse";

import {
  buildNuggetUserMessage,
  NUGGET_MODEL,
  NUGGET_OUTPUT_SCHEMA,
  NUGGET_SYSTEM_PROMPT,
} from "./calc.ts";
import type { RunContext } from "./infra.ts";
import type {
  DevpostRow,
  EventInfo,
  NuggetInput,
  NuggetPath,
  RawApplicant,
  RawAttendance,
  RawAwardPlacement,
  RawCommit,
  RawCommitDetail,
  RawDayOfItem,
  RawPreHackathonWorkshop,
  RawSocial,
  RawStamp,
  RepoRef,
} from "./types.ts";

// ---------------------------------------------------------------------------
// Firestore
// ---------------------------------------------------------------------------

const ATTENDING = "acceptedAndAttending";

/** getAll takes at most a few hundred refs comfortably; also the bar's step size. */
const SOCIALS_CHUNK = 300;

/** Replaces every Timestamp with its ISO string, so the raw cache is plain JSON. */
function toPlain<T>(value: unknown): T {
  if (value instanceof Timestamp) return value.toDate().toISOString() as T;
  if (Array.isArray(value)) return value.map((item) => toPlain(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toPlain(v)])) as T;
  }
  return value as T;
}

function eventRef(ctx: RunContext) {
  return ctx.db.collection("Hackathons").doc(ctx.config.eventId);
}

/**
 * raw/event.json
 * `Hackathons/{eventId}.wrapped.{hackathonStart, hackathonEnd}` (Timestamps).
 * name comes from CONFIG.eventName. checkInOpensAt: `wrapped.checkInOpensAt` if set (Q20).
 */
export async function fetchEventInfo(ctx: RunContext): Promise<EventInfo> {
  return ctx.cache.raw("event", async () => {
    const snap = await eventRef(ctx).get();
    if (!snap.exists) throw new Error(`Hackathons/${ctx.config.eventId} does not exist`);

    const wrapped = toPlain<Record<string, string | undefined>>(snap.get("wrapped") ?? {});
    // Both bound the commit window and every duration; no sensible default exists.
    if (!wrapped.hackathonStart || !wrapped.hackathonEnd) {
      throw new Error(
        `Hackathons/${ctx.config.eventId}.wrapped.hackathonStart and .hackathonEnd must be set`,
      );
    }

    return {
      eventId: ctx.config.eventId,
      name: ctx.config.eventName,
      hackathonStart: wrapped.hackathonStart,
      hackathonEnd: wrapped.hackathonEnd,
      checkInOpensAt: wrapped.checkInOpensAt ?? null,
    };
  });
}

/**
 * raw/applicants.json
 * `Hackathons/{eventId}/Applicants` where status.applicationStatus == "acceptedAndAttending".
 */
export async function fetchAttendingApplicants(ctx: RunContext): Promise<RawApplicant[]> {
  return ctx.cache.raw("applicants", async () => {
    const snapshot = await eventRef(ctx)
      .collection("Applicants")
      .where("status.applicationStatus", "==", ATTENDING)
      // Applicant docs carry the whole application; read only what RawApplicant holds.
      .select(
        "basicInfo.email",
        "basicInfo.preferredName",
        "basicInfo.legalFirstName",
        "skills.github",
        "dayOf",
        "preDayOf",
      )
      .get();
    return snapshot.docs.map((doc) => ({ ...toPlain<Omit<RawApplicant, "uid">>(doc.data()), uid: doc.id }));
  });
}

/** raw/dayof.json. `Hackathons/{eventId}/DayOf`, to tell workshops from other scans. */
export async function fetchDayOfSchedule(ctx: RunContext): Promise<RawDayOfItem[]> {
  return ctx.cache.raw("dayof", async () => {
    const snapshot = await eventRef(ctx).collection("DayOf").select("type").get();
    // Items with no type exist on older events; they count as neither kind.
    return snapshot.docs.map((doc) => ({ id: doc.id, type: doc.get("type") ?? "" }));
  });
}

/** raw/prehackathon-workshops.json. `Hackathons/{eventId}/PreHackathonWorkshops` (Q1). */
export async function fetchPreHackathonWorkshops(ctx: RunContext): Promise<RawPreHackathonWorkshop[]> {
  return ctx.cache.raw("prehackathon-workshops", async () => {
    const snapshot = await eventRef(ctx).collection("PreHackathonWorkshops").select("name").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, name: doc.get("name") ?? doc.id }));
  });
}

/**
 * raw/attendance.json
 * The whole top-level `Attendance` collection, projected to {uid, hackathonId}: one
 * query instead of one per hacker.
 */
export async function fetchAttendance(ctx: RunContext): Promise<RawAttendance[]> {
  return ctx.cache.raw("attendance", async () => {
    const snapshot = await ctx.db.collection("Attendance").select("uid", "hackathonId").get();
    const records: RawAttendance[] = [];
    for (const doc of snapshot.docs) {
      const uid = doc.get("uid");
      const hackathonId = doc.get("hackathonId");
      if (typeof uid === "string" && typeof hackathonId === "string") records.push({ uid, hackathonId });
    }
    const skipped = snapshot.size - records.length;
    if (skipped > 0) ctx.ui.warn(`${skipped} Attendance docs skipped (missing uid or hackathonId)`);
    return records;
  });
}

/** raw/stamps.json. Top-level `Stamps` where hackathon == eventId, to resolve Socials' stamp ids (Q7). */
export async function fetchStamps(ctx: RunContext): Promise<RawStamp[]> {
  return ctx.cache.raw("stamps", async () => {
    const snapshot = await ctx.db
      .collection("Stamps")
      .where("hackathon", "==", ctx.config.eventId)
      .select("name", "imgURL", "description")
      .get();
    return snapshot.docs.map((doc) => ({ ...(doc.data() as Omit<RawStamp, "id">), id: doc.id }));
  });
}

/** raw/socials.json. `Socials/{uid}` for the given uids, via getAll in chunks. */
export async function fetchSocials(ctx: RunContext, uids: string[]): Promise<RawSocial[]> {
  return ctx.cache.raw("socials", async () => {
    const socials = ctx.db.collection("Socials");
    const bar = ctx.ui.bar("Socials", uids.length);
    const result: RawSocial[] = [];

    for (let i = 0; i < uids.length; i += SOCIALS_CHUNK) {
      const refs = uids.slice(i, i + SOCIALS_CHUNK).map((uid) => socials.doc(uid));
      const docs = await ctx.db.getAll(...refs, {
        fieldMask: ["email", "unlockedStamps", "hackerWrappedOptIn"],
      });
      for (const doc of docs) {
        // No Socials doc: absent here, which buildHacker and isOptedOut read as included.
        if (doc.exists) result.push({ ...toPlain<Omit<RawSocial, "uid">>(doc.data() as DocumentData), uid: doc.id });
      }
      bar.tick(refs.length);
    }

    bar.stop();
    return result;
  });
}

// ---------------------------------------------------------------------------
// Devpost
// ---------------------------------------------------------------------------

/**
 * Accepted header names per field, compared after `normalizeHeader`. An exact alias
 * wins over a header that merely contains one. TODO(Q17): lock against a real export.
 */
const COLUMN_ALIASES = {
  title: ["project title", "project name", "title"],
  submissionUrl: ["submission url", "submission link", "devpost url"],
  techStack: ["built with", "technologies", "tech stack"],
  about: ["about the project", "about"],
  tryItOut: ["try it out links", "try it out", "tryitout links"],
} as const;

type Column = keyof typeof COLUMN_ALIASES;

/** Submitter and every "Team Member N Email" column; at least one must exist. */
const EMAIL_HEADER = /^(submitter|team member \d+) email$/;

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function resolveColumn(headers: string[], aliases: readonly string[]): string | undefined {
  const normalized = headers.map((header) => [normalizeHeader(header), header] as const);
  for (const alias of aliases) {
    const exact = normalized.find(([norm]) => norm === alias);
    if (exact) return exact[1];
  }
  return normalized.find(([norm]) => aliases.some((alias) => norm.includes(alias)))?.[1];
}

function splitList(value: string | undefined): string[] {
  return (value ?? "")
    .split(/[,;\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Parses the Devpost export at `config.devpostCsvPath`. Not cached: the file is
 * already local.
 *
 * Fails on a missing required column instead of guessing, and prints the headers it
 * found. TODO(Q17): lock the column names against a real export.
 */
export async function parseDevpostCsv(ctx: RunContext): Promise<DevpostRow[]> {
  const csvPath = ctx.config.devpostCsvPath;
  const text = await fs.readFile(csvPath, "utf8");
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  const headers = parsed.meta.fields ?? [];

  const columns = Object.fromEntries(
    Object.entries(COLUMN_ALIASES).map(([field, aliases]) => [field, resolveColumn(headers, aliases)]),
  ) as Record<Column, string | undefined>;
  const emailColumns = headers.filter((header) => EMAIL_HEADER.test(normalizeHeader(header)));

  const missing = [
    ...Object.entries(columns).filter(([, header]) => !header).map(([field]) => field),
    ...(emailColumns.length === 0 ? ["member emails"] : []),
  ];
  if (missing.length > 0) {
    throw new Error(
      `Devpost CSV ${csvPath} is missing columns: ${missing.join(", ")}.\n` +
        `Headers found:\n${headers.map((header) => `  ${header}`).join("\n")}\n` +
        "Update COLUMN_ALIASES / EMAIL_HEADER in sources.ts.",
    );
  }
  if (parsed.errors.length > 0) {
    const first = parsed.errors[0];
    ctx.ui.warn(`${parsed.errors.length} CSV parse errors, first: ${first.message} (row ${first.row})`);
  }

  const cell = (row: Record<string, string>, column: Column) => row[columns[column]!]?.trim() ?? "";
  const rows: DevpostRow[] = [];

  for (const row of parsed.data) {
    const submissionUrl = cell(row, "submissionUrl");
    // Devpost pads exports with blank rows; a row without a URL has no project id.
    if (!submissionUrl) continue;

    rows.push({
      submissionUrl,
      title: cell(row, "title") || "Untitled project",
      techStack: splitList(cell(row, "techStack")),
      about: cell(row, "about"),
      tryItOutLinks: splitList(cell(row, "tryItOut")),
      memberEmails: [
        ...new Set(emailColumns.map((column) => row[column]?.trim().toLowerCase()).filter(Boolean)),
      ],
    });
  }

  // A malformed quote can collapse the whole file into one field. Continuing would give
  // every hacker a project-less doc that looks legitimate.
  if (rows.length === 0) throw new Error(`No projects parsed from ${csvPath}`);

  return rows;
}

// ---------------------------------------------------------------------------
// GitHub
// ---------------------------------------------------------------------------

const GITHUB_API = "https://api.github.com";

/** Commits from this long before hackathonStart are fetched too, so a small window change needs no re-fetch. */
const COMMIT_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;

/** Guards against a linked mega-repo; 30 pages is 3000 commits since the lookback. */
const MAX_COMMIT_PAGES = 30;

/** Private, deleted, empty (409) or blocked (451): cached as null, never retried. */
const UNREADABLE_STATUSES = new Set([404, 409, 451]);

/** A commit whose diff GitHub won't compute (422, e.g. too large) is unreadable too. */
const UNREADABLE_COMMIT_STATUSES = new Set([...UNREADABLE_STATUSES, 422]);

function githubHeaders(): Record<string, string> {
  const token = process.env.GITHUB_PAT?.trim();
  if (!token) throw new Error("GITHUB_PAT is not set in .env");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

const nextPage = (response: Response) => response.headers.get("link")?.match(/<([^>]+)>;\s*rel="next"/)?.[1];

interface GithubCommit {
  sha: string;
  commit: { message: string; committer: { date: string } | null };
  author: { login: string; type: string } | null;
}

/**
 * raw/github/{owner}__{repo}.json
 * Paginated `GET /repos/{owner}/{repo}/commits` (100 per page) with GITHUB_PAT, from
 * hackathonStart minus a week. GitHub's `since` compares committer dates, like the window.
 * A 404/409 (private, deleted, empty) caches as null so it is not retried.
 *
 * Default branch only (Q9). Merge commits count as commits; countCommitLines gives them 0 lines.
 */
export async function fetchRepoCommits(
  ctx: RunContext,
  repo: RepoRef,
  hackathonStart: string,
): Promise<RawCommit[] | null> {
  // GitHub names are case-insensitive; one cache file per repo however it was linked.
  const key = `github/${repo.owner}__${repo.repo}`.toLowerCase();
  return ctx.cache.raw(key, async () => {
    const headers = githubHeaders();
    const since = new Date(new Date(hackathonStart).getTime() - COMMIT_LOOKBACK_MS).toISOString();
    let url: string | undefined =
      `${GITHUB_API}/repos/${repo.owner}/${repo.repo}/commits?per_page=100&since=${since}`;
    const commits: RawCommit[] = [];

    for (let page = 0; url; page++) {
      if (page === MAX_COMMIT_PAGES) {
        ctx.ui.warn(`${repo.owner}/${repo.repo}: stopped at ${commits.length} commits (page cap)`);
        break;
      }
      const response = await fetch(url, { headers });

      if (UNREADABLE_STATUSES.has(response.status)) return null;
      if (!response.ok) {
        throw new Error(githubError(`${repo.owner}/${repo.repo}`, response, await response.text()));
      }

      for (const item of (await response.json()) as GithubCommit[]) {
        const committedAt = item.commit.committer?.date;
        if (!committedAt) continue;
        commits.push({
          sha: item.sha,
          committedAt,
          message: item.commit.message,
          authorLogin: item.author?.login ?? null,
          authorType: item.author?.type ?? null,
        });
      }
      url = nextPage(response);
    }

    return commits;
  });
}

interface GithubCommitDetail {
  parents: unknown[];
  files?: Array<{ filename: string; additions: number }>;
}

const commitDetailKey = (sha: string) => `github-commits/${sha}`;

/** Whether a commit's stats are already in raw/, so enrich can count what it must fetch. */
export function isCommitDetailCached(ctx: RunContext, sha: string): Promise<boolean> {
  return ctx.cache.hasRaw(commitDetailKey(sha));
}

/**
 * raw/github-commits/{sha}.json
 * `GET /repos/{owner}/{repo}/commits/{sha}`, following the `link` header when the file
 * list runs past 300. Immutable: a sha's contents never change, so bypassCache keeps it.
 * 404/409/422/451 caches as null; anything else (a rate limit included) throws, so a rerun
 * resumes from the cache.
 */
export async function fetchCommitDetail(
  ctx: RunContext,
  repo: RepoRef,
  sha: string,
): Promise<RawCommitDetail | null> {
  return ctx.cache.raw(
    commitDetailKey(sha),
    async () => {
      const headers = githubHeaders();
      const name = `${repo.owner}/${repo.repo}@${sha.slice(0, 7)}`;
      let url: string | undefined = `${GITHUB_API}/repos/${repo.owner}/${repo.repo}/commits/${sha}`;
      let detail: RawCommitDetail | undefined;

      while (url) {
        const response = await fetch(url, { headers });
        if (UNREADABLE_COMMIT_STATUSES.has(response.status)) return null;
        if (!response.ok) throw new Error(githubError(name, response, await response.text()));

        const page = (await response.json()) as GithubCommitDetail;
        // Every page repeats the commit; only the files differ.
        detail ??= { parentCount: page.parents.length, files: [] };
        for (const file of page.files ?? []) {
          detail.files.push({ filename: file.filename, additions: file.additions });
        }
        url = nextPage(response);
      }
      return detail ?? null;
    },
    { immutable: true },
  );
}

/** `GET /rate_limit` (free): core requests left, and when the window resets (ISO). */
export async function fetchGithubRateLimit(): Promise<{ remaining: number; reset: string }> {
  const response = await fetch(`${GITHUB_API}/rate_limit`, { headers: githubHeaders() });
  if (!response.ok) throw new Error(githubError("rate_limit", response, await response.text()));
  const { resources } = (await response.json()) as {
    resources: { core: { remaining: number; reset: number } };
  };
  return {
    remaining: resources.core.remaining,
    reset: new Date(resources.core.reset * 1000).toISOString(),
  };
}

/** A fatal GitHub error. Thrown rather than cached, so the next run retries the request. */
function githubError(name: string, response: Response, body: string): string {
  if (response.status === 401) return `GitHub rejected GITHUB_PAT (401) on ${name}`;
  if (response.headers.get("x-ratelimit-remaining") === "0") {
    const reset = new Date(Number(response.headers.get("x-ratelimit-reset")) * 1000);
    return `GitHub rate limit hit on ${name}; resets at ${reset.toLocaleTimeString()}. Rerun then.`;
  }
  return `GitHub ${response.status} on ${name}: ${body.slice(0, 200)}`;
}

// ---------------------------------------------------------------------------
// Judging portal (Supabase)
// ---------------------------------------------------------------------------

/** Lowercase letters and digits only: "cmd-f" + 2026 and "cmd-f2026" both give "cmdf2026". */
const eventKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * raw/awards.json
 * Every `award_placement` row for this event. The event is the portal's `hackathon` row
 * whose name + year equals eventId, e.g. {name: "cmd-f", year: 2026} for "cmd-f2026".
 *
 * Needs SUPABASE_SECRET_KEY: the publishable key authenticates but RLS hides every row,
 * which would read as "no prizes".
 */
export async function fetchAwardPlacements(ctx: RunContext): Promise<RawAwardPlacement[]> {
  return ctx.cache.raw("awards", async () => {
    const url = process.env.VITE_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SECRET_KEY?.trim();
    if (!url) throw new Error("VITE_PUBLIC_SUPABASE_URL is not set");
    if (!key) {
      throw new Error(
        "SUPABASE_SECRET_KEY is not set (Supabase dashboard > Project Settings > API Keys > sb_secret_...)",
      );
    }
    const supabase = createClient(url, key, { auth: { persistSession: false } });

    const hackathons = await supabase.from("hackathon").select("hackathon_id, name, year");
    if (hackathons.error) throw new Error(`Supabase hackathon query: ${hackathons.error.message}`);
    const target = eventKey(ctx.config.eventId);
    const hackathon = hackathons.data.find((h) => eventKey(`${h.name}${h.year}`) === target);
    if (!hackathon) {
      const known = hackathons.data.map((h) => `${h.name}${h.year}`).join(", ");
      throw new Error(`No judging-portal hackathon matches ${ctx.config.eventId}. Found: ${known}`);
    }

    // The award's name and the project's Devpost URL come in as embedded joins.
    const placements = await supabase
      .from("award_placement")
      .select("placement, award:award_id!inner(name), project:project_id!inner(name, devpost_url)")
      .eq("project.hackathon_id", hackathon.hackathon_id);
    if (placements.error) {
      throw new Error(`Supabase award_placement query: ${placements.error.message}`);
    }

    const rows = placements.data as unknown as Array<{
      placement: number | null;
      award: { name: string };
      project: { name: string; devpost_url: string | null };
    }>;
    return rows.map((row) => ({
      award: row.award.name,
      placement: row.placement,
      projectName: row.project.name,
      devpostUrl: row.project.devpost_url,
    }));
  });
}

// ---------------------------------------------------------------------------
// Anthropic (Nugget)
// ---------------------------------------------------------------------------

/** Results usually land within minutes; batches expire after 24 h. */
const BATCH_POLL_MS = 30_000;

function anthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set (needed to generate Nugget messages)");
  // Keys not scoped to a workspace must name one on every request.
  const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID?.trim();
  return new Anthropic({
    apiKey,
    defaultHeaders: workspaceId ? { "anthropic-workspace-id": workspaceId } : undefined,
  });
}

export interface NuggetRequest {
  customId: string;
  input: NuggetInput;
  candidates: NuggetPath[];
}

/** What came back for one request: the text and stop reason, or why it failed. */
export type NuggetResponse = { text: string; stopReason: string | null } | { error: string };

/** Submits one Message Batch for every request. Returns the batch id. */
export async function submitNuggetBatch(requests: NuggetRequest[]): Promise<string> {
  const batch = await anthropicClient().messages.batches.create({
    requests: requests.map(({ customId, input, candidates }) => ({
      custom_id: customId,
      params: {
        model: NUGGET_MODEL,
        max_tokens: 600,
        system: NUGGET_SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildNuggetUserMessage(input, candidates) }],
        output_config: { format: { type: "json_schema", schema: NUGGET_OUTPUT_SCHEMA } },
      },
    })),
  });
  return batch.id;
}

/** Polls until the batch ends, then returns every result by custom_id. */
export async function collectNuggetBatch(
  ctx: RunContext,
  batchId: string,
): Promise<Map<string, NuggetResponse>> {
  const client = anthropicClient();
  let batch = await client.messages.batches.retrieve(batchId);
  const total = Object.values(batch.request_counts).reduce((sum, n) => sum + n, 0);
  const bar = ctx.ui.bar("Nugget batch", total);
  let shown = 0;

  for (;;) {
    const { processing } = batch.request_counts;
    bar.tick(total - processing - shown);
    shown = total - processing;
    if (batch.processing_status === "ended") break;
    await new Promise((resolve) => setTimeout(resolve, BATCH_POLL_MS));
    batch = await client.messages.batches.retrieve(batchId);
  }
  bar.stop();

  // Results come back in any order; custom_id ties them to requests.
  const responses = new Map<string, NuggetResponse>();
  for await (const { custom_id, result } of await client.messages.batches.results(batchId)) {
    if (result.type === "succeeded") {
      const text = result.message.content.flatMap((block) => (block.type === "text" ? [block.text] : []));
      responses.set(custom_id, { text: text.join(""), stopReason: result.message.stop_reason });
    } else if (result.type === "errored") {
      responses.set(custom_id, { error: `errored: ${result.error.error.message}` });
    } else {
      responses.set(custom_id, { error: result.type });
    }
  }
  return responses;
}
