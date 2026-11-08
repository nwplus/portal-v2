/**
 * Hacker Wrapped batch script. See README.md.
 *
 *   pnpm wrapped write                 resume where the last run stopped
 *   pnpm wrapped write --from enrich   redo enrich and everything after it
 *   pnpm wrapped write --from write    rewrite every doc (keeps existing prizes)
 *   pnpm wrapped prize | stats | delete
 *
 * Env: FIREBASE_SERVICE_ACCOUNT, DEV_FIREBASE_SERVICE_ACCOUNT, GITHUB_PAT,
 *      VITE_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY (prize)
 */

import "dotenv/config";

import { parseArgs } from "node:util";

import { createCache, createUi, initFirestore, loadProgress } from "./infra.ts";
import type { RunConfig, RunContext } from "./infra.ts";
import { runDelete, runPrize, runStats } from "./modes.ts";
import { CHECKPOINTS } from "./types.ts";
import type { Mode, RestartPoint } from "./types.ts";
import { runWrite } from "./write.ts";

// ---------------------------------------------------------------------------
// Set these before each run
// ---------------------------------------------------------------------------

const CONFIG: RunConfig = {
  /** Firestore doc id under Hackathons/, e.g. "hackcamp2026". */
  eventId: "HackCamp2026",
  /** Display name on the slides (`event`, `summary.event`). */
  eventName: "HackCamp 2026",
  /**
   * Key into `InternalWebsites/Portal.hackingStart` / `.hackingEnd`, which give the
   * commit window and submission deadline: "hackcamp" | "nwhacks" | "cmd-f".
   */
  portalKey: "hackcamp",
  env: "prod",
  /** Off: the run stops after writing cache/.../output/docs.json. */
  writeToFirestore: false,
  /** On: re-fetch every source instead of reading cache/.../raw/. */
  bypassCache: false,
  devpostCsvPath: "wrapped/csv/hackcamp2026.csv",
  /**
   * Portal's hackcamp times (20:00Z, 13:00 Vancouver) are an hour late: they were entered
   * as PST, but BC stays on UTC-7. Hacking ran 12:00 to 12:00 Vancouver time.
   */
  hackingWindow: { start: "2026-11-07T19:00:00.000Z", end: "2026-11-08T19:00:00.000Z" },
};

// ---------------------------------------------------------------------------

const MODES = ["write", "prize", "stats", "delete"] as const satisfies readonly Mode[];

const RESTART_POINTS: readonly RestartPoint[] = ["fetch", ...CHECKPOINTS, "write"];

function parseCli(): { mode: Mode; from: RestartPoint | undefined } {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: { from: { type: "string" } },
  });

  const mode = positionals[0] as Mode;
  if (!MODES.includes(mode)) {
    throw new Error(`Mode must be one of: ${MODES.join(", ")}`);
  }

  const from = values.from as RestartPoint | undefined;
  if (from !== undefined && !RESTART_POINTS.includes(from)) {
    throw new Error(`--from must be one of: ${RESTART_POINTS.join(", ")}`);
  }
  if (from !== undefined && mode !== "write") {
    throw new Error("--from only applies to write");
  }

  return { mode, from };
}

async function main() {
  const { mode, from } = parseCli();
  if (!CONFIG.eventId) throw new Error("Set CONFIG.eventId at the top of script.ts");

  const cache = createCache(CONFIG);
  const ctx: RunContext = {
    config: CONFIG,
    db: initFirestore(CONFIG.env),
    cache,
    progress: await loadProgress(cache, CONFIG),
    ui: createUi(),
  };

  switch (mode) {
    case "write":
      return runWrite(ctx, from);
    case "prize":
      return runPrize(ctx);
    case "stats":
      return runStats(ctx);
    case "delete":
      return runDelete(ctx);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
