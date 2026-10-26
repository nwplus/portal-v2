/**
 * Plumbing shared by every mode: cache, progress file, terminal UI, Firestore.
 * Nothing here knows about Wrapped fields.
 */

import { readFileSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";

import { STAGES } from "./types.ts";
import type { Env, Progress, RestartPoint, Stage, StageStatus } from "./types.ts";

/** Placeholder body for skeleton functions. */
export function todo(what: string): never {
  throw new Error(`not implemented: ${what}`);
}

// ---------------------------------------------------------------------------
// Run context
// ---------------------------------------------------------------------------

export interface RunConfig {
  eventId: string;
  eventName: string;
  env: Env;
  writeToFirestore: boolean;
  bypassCache: boolean;
  devpostCsvPath: string;
  /** At most this many Nugget messages in total, stored ones included; the rest stay null. Null: no limit. */
  nuggetLimit: number | null;
}

/** Passed to every stage so none of them reach for globals. */
export interface RunContext {
  config: RunConfig;
  db: Firestore;
  cache: Cache;
  progress: ProgressTracker;
  ui: Ui;
}

// ---------------------------------------------------------------------------
// Cache
//
//   cache/{env}/{eventId}/
//     raw/{key}.json        fetched data, one file per source (or per repo / commit)
//     stages/{stage}.json   each stage's output, read by the next stage
//     overrides.json        hand-written match corrections
//     progress.json
//     output/docs.json      assembled docs, written whether or not Firestore is
// ---------------------------------------------------------------------------

export const CACHE_ROOT = path.join(import.meta.dirname, "cache");

export interface Cache {
  dir: string;
  /**
   * Returns raw/{key}.json if present (and not bypassed), else runs `fetch` and stores it.
   * `immutable`: the source never changes (a commit by sha), so bypassCache is ignored.
   */
  raw<T>(key: string, fetch: () => Promise<T>, options?: { immutable?: boolean }): Promise<T>;
  /** Whether raw/{key}.json exists, bypassCache aside. */
  hasRaw(key: string): Promise<boolean>;
  readStage<T>(stage: Stage): Promise<T>;
  writeStage<T>(stage: Stage, data: T): Promise<void>;
  readJson<T>(relativePath: string, fallback: T): Promise<T>;
  writeJson(relativePath: string, data: unknown): Promise<void>;
}

export function createCache(config: RunConfig): Cache {
  const dir = path.join(CACHE_ROOT, config.env, config.eventId);
  const resolve = (relativePath: string) => path.join(dir, relativePath);

  const readJson = async <T>(relativePath: string, fallback: T): Promise<T> => {
    try {
      return JSON.parse(await fs.readFile(resolve(relativePath), "utf8")) as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return fallback;
      throw error;
    }
  };

  return {
    dir,

    async raw<T>(key: string, fetch: () => Promise<T>, options?: { immutable?: boolean }) {
      const file = `raw/${key}.json`;
      // A missing file is a miss; a stored null (private repo) is a hit.
      const missing = Symbol("missing");
      if (!config.bypassCache || options?.immutable) {
        const hit = await readJson<T | typeof missing>(file, missing);
        if (hit !== missing) return hit;
      }
      const data = await fetch();
      await writeJsonAtomic(resolve(file), data);
      return data;
    },

    async hasRaw(key) {
      try {
        await fs.access(resolve(`raw/${key}.json`));
        return true;
      } catch {
        return false;
      }
    },

    async readStage<T>(stage: Stage) {
      const data = await readJson<T | undefined>(`stages/${stage}.json`, undefined);
      if (data === undefined) {
        throw new Error(`No output for stage "${stage}" in ${dir}. Run with --from ${stage}.`);
      }
      return data;
    },

    writeStage: (stage, data) => writeJsonAtomic(resolve(`stages/${stage}.json`), data),
    readJson,
    writeJson: (relativePath, data) => writeJsonAtomic(resolve(relativePath), data),
  };
}

/** Write-then-rename, so a Ctrl-C mid-write never leaves half a JSON file behind. */
async function writeJsonAtomic(file: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`);
  await fs.rename(tmp, file);
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export interface ProgressTracker {
  state: Progress;
  /**
   * First stage to run: `from` if given (resetting it and every later stage, and the
   * write ledger), else the first stage not done.
   */
  resolveStart(from: RestartPoint | undefined): Stage;
  setStatus(stage: Stage, status: StageStatus): Promise<void>;
  /** Throttled write of the live counter. */
  tick(stage: Stage, done: number, total: number): Promise<void>;
  markWritten(uids: string[]): Promise<void>;
}

const PROGRESS_FILE = "progress.json";
const TICK_INTERVAL_MS = 1000;

function emptyProgress(config: RunConfig): Progress {
  return {
    eventId: config.eventId,
    env: config.env,
    updatedAt: new Date().toISOString(),
    stages: Object.fromEntries(STAGES.map((stage) => [stage, { status: "pending" }])) as Progress["stages"],
    writtenUids: [],
  };
}

export async function loadProgress(cache: Cache, config: RunConfig): Promise<ProgressTracker> {
  const state = await cache.readJson(PROGRESS_FILE, emptyProgress(config));
  let lastTickAt = 0;
  let saving = Promise.resolve();

  // Chained: concurrent ticks (enrich's commit fetch) would race on one temp file.
  const save = () => {
    const write = async () => {
      state.updatedAt = new Date().toISOString();
      await cache.writeJson(PROGRESS_FILE, state);
    };
    saving = saving.then(write, write);
    return saving;
  };

  return {
    state,

    resolveStart(from) {
      if (from === undefined) {
        // "skipped" is not done: turning writeToFirestore on and rerunning goes to write.
        // Everything done also lands on write, which resumes from the ledger (a no-op).
        return STAGES.find((stage) => state.stages[stage].status !== "done") ?? "write";
      }
      // Saved by the setStatus("running") that follows.
      for (const stage of STAGES.slice(STAGES.indexOf(from))) {
        state.stages[stage] = { status: "pending" };
      }
      state.writtenUids = [];
      return from;
    },

    async setStatus(stage, status) {
      const now = new Date().toISOString();
      const entry = state.stages[stage];
      if (status === "pending") state.stages[stage] = { status };
      else if (status === "running") state.stages[stage] = { status, startedAt: now };
      else state.stages[stage] = { ...entry, status, finishedAt: now };
      await save();
    },

    async tick(stage, done, total) {
      Object.assign(state.stages[stage], { done, total });
      const now = Date.now();
      // Always write the last tick so a finished bar is never reported short.
      if (done < total && now - lastTickAt < TICK_INTERVAL_MS) return;
      lastTickAt = now;
      await save();
    },

    async markWritten(uids) {
      state.writtenUids = [...new Set([...state.writtenUids, ...uids])];
      await save();
    },
  };
}

// ---------------------------------------------------------------------------
// Terminal UI
// ---------------------------------------------------------------------------

export interface ProgressBar {
  tick(by?: number): void;
  stop(): void;
}

export interface Ui {
  /** Section header, e.g. "[2/5] Match". */
  section(title: string): void;
  bar(label: string, total: number): ProgressBar;
  /** e.g. "Firestore fetch complete! 412 hackers recorded" */
  success(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  /** Blocks until the user picks one of `choices` (single letters). */
  prompt<C extends string>(question: string, choices: readonly C[]): Promise<C>;
}

const BAR_WIDTH = 30;

export function createUi(): Ui {
  const out = process.stdout;
  let lines: AsyncIterator<string> | undefined;

  return {
    section: (title) => console.log(`\n=== ${title} ===`),
    success: (message) => console.log(`✓ ${message}`),
    info: (message) => console.log(`  ${message}`),
    warn: (message) => console.warn(`! ${message}`),

    bar(label, total) {
      let done = 0;
      let lastDrawAt = 0;
      // Redraw in place on a terminal; elsewhere (piped, CI) print only the final line.
      const render = () => {
        const filled = total === 0 ? BAR_WIDTH : Math.round((done / total) * BAR_WIDTH);
        return `${label} [${"#".repeat(filled)}${"-".repeat(BAR_WIDTH - filled)}] ${done}/${total}`;
      };
      const draw = () => {
        if (out.isTTY) out.write(`\r${render()}`);
      };
      draw();

      return {
        tick(by = 1) {
          done = Math.min(done + by, total);
          const now = Date.now();
          if (done === total || now - lastDrawAt > 50) {
            lastDrawAt = now;
            draw();
          }
        },
        stop() {
          if (out.isTTY) out.write(`\r${render()}\n`);
          else console.log(render());
        },
      };
    },

    async prompt(question, choices) {
      // One line iterator for the whole run: it buffers, so piped answers aren't dropped
      // between prompts the way separate rl.question calls drop them.
      lines ??= readline.createInterface({ input: process.stdin })[Symbol.asyncIterator]();
      for (;;) {
        out.write(`${question} [${choices.join("/")}] `);
        const next = await lines.next();
        if (next.done) throw new Error("stdin closed before an answer");
        const choice = choices.find((c) => c === next.value.trim().toLowerCase());
        if (choice) return choice;
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Firestore
// ---------------------------------------------------------------------------

/** Picks FIREBASE_SERVICE_ACCOUNT or DEV_FIREBASE_SERVICE_ACCOUNT by `env`. */
export function initFirestore(env: Env): Firestore {
  // The project comes from the credential, never from a project id, so a typo in
  // eventId can't aim a run at the wrong project.
  const varName = env === "prod" ? "FIREBASE_SERVICE_ACCOUNT" : "DEV_FIREBASE_SERVICE_ACCOUNT";
  const raw = process.env[varName]?.trim();
  if (!raw) {
    throw new Error(`${varName} is not set. Put the service account JSON, or a path to it, in .env`);
  }

  const credentials = JSON.parse(raw.startsWith("{") ? raw : readFileSync(raw, "utf8"));
  console.log(`Firestore project: ${credentials.project_id ?? "unknown"} (${env})`);

  return getFirestore(initializeApp({ credential: cert(credentials) }));
}
