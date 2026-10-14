/** The modes other than write. */

import { applyPrizes, matchPrizesToProjects } from "./calc.ts";
import type { RunContext } from "./infra.ts";
import { fetchAwardPlacements } from "./sources.ts";
import type {
  MatchOutput,
  WrappedDoc,
  WrappedStatsSession,
  WrappedStatsSummary,
} from "./types.ts";

/** Doc id of the aggregate inside `WrappedStats`, alongside the per-uid session docs. */
const STATS_SUMMARY_DOC_ID = "Summary";

/** Same limit as write: under Firestore's 500 writes per batch. */
const PRIZE_BATCH_SIZE = 450;

/**
 * After judging: reads the judging portal's award placements, joins them to the match
 * stage's projects by Devpost slug, and runs applyPrizes on every member's Wrapped doc
 * (appends the prize names, upgrades the archetype to THE_PRIZEWINNER).
 *
 * Always writes `cache/{env}/{eventId}/output/prizes.json`; writes Firestore only with
 * writeToFirestore. Safe to rerun: applyPrizes dedupes names. Rerun with bypassCache to
 * pick up awards changed in the portal.
 */
export async function runPrize(ctx: RunContext): Promise<void> {
  const { config, db, cache, ui } = ctx;
  ui.section(`Prize: ${config.eventId}`);

  const match = await cache.readStage<MatchOutput>("match");
  const awards = await fetchAwardPlacements(ctx);
  const { winners, prizesByUid, unmatched } = matchPrizesToProjects(awards, match.projects);
  const uids = Object.keys(prizesByUid);

  ui.info(`${awards.length} award placements`);
  ui.info(`${winners.length} prizewinning projects, ${uids.length} hackers`);
  for (const winner of winners) {
    ui.info(`  ${winner.title} (${winner.memberUids.length}): ${winner.prizes.join(", ")}`);
  }
  // Usually a team with no matched hacker, or a Devpost URL typed differently in the portal.
  if (unmatched.length > 0) {
    ui.warn(`${unmatched.length} prizewinning projects match no CSV row; their prizes reach no doc:`);
    for (const project of unmatched) {
      ui.warn(`  ${project.projectName} ${project.devpostUrl ?? "(no Devpost URL)"}`);
    }
  }

  await cache.writeJson("output/prizes.json", { winners, unmatched, prizesByUid });

  if (!config.writeToFirestore) {
    ui.info("Dry run: not writing prizes. See output/prizes.json.");
    return;
  }
  if (uids.length === 0) return;

  if (config.env === "prod") {
    const answer = await ui.prompt(
      `Add prizes to ${uids.length} docs in PROD Hackathons/${config.eventId}/Wrapped?`,
      ["y", "n"] as const,
    );
    if (answer === "n") throw new Error("Prize run cancelled; nothing written.");
  }

  const collection = db.collection("Hackathons").doc(config.eventId).collection("Wrapped");
  const missing: string[] = [];
  let updated = 0;

  for (let i = 0; i < uids.length; i += PRIZE_BATCH_SIZE) {
    const chunk = uids.slice(i, i + PRIZE_BATCH_SIZE);
    const refs = chunk.map((uid) => collection.doc(uid));
    const snaps = await db.getAll(...refs);

    const batch = db.batch();
    for (const [j, snap] of snaps.entries()) {
      if (!snap.exists) {
        missing.push(chunk[j]);
        continue;
      }
      batch.set(refs[j], applyPrizes(snap.data() as WrappedDoc, prizesByUid[chunk[j]]));
      updated++;
    }
    await batch.commit();
  }

  ui.success(`${updated} docs updated`);
  if (missing.length > 0) {
    ui.warn(`${missing.length} winners have no Wrapped doc (run write first): ${missing.join(", ")}`);
  }
}

/**
 * Organizer statistics: rolls the Portal's per-hacker `WrappedStats/{uid}` docs up into
 * `WrappedStats/Summary`, with rates over the number of decks generated.
 *
 * Always writes `cache/{env}/{eventId}/output/stats.json`; writes Firestore only with
 * writeToFirestore, like every other mode.
 */
export async function runStats(ctx: RunContext): Promise<void> {
  const { config, db, cache, ui } = ctx;
  ui.section(`Stats: ${config.eventId}`);

  const eventRef = db.collection("Hackathons").doc(config.eventId);
  const [deckCount, sessions] = await Promise.all([
    // count() bills one read per 1000 index entries, so the denominator is ~free.
    eventRef.collection("Wrapped").count().get(),
    eventRef.collection("WrappedStats").get(),
  ]);

  const numberOfHackers = deckCount.data().count;
  // An all-zero summary would read as "nobody opened it" rather than "nothing to open".
  if (numberOfHackers === 0) {
    throw new Error(`No docs in Hackathons/${config.eventId}/Wrapped. Run write before stats.`);
  }

  let opens = 0;
  let completions = 0;
  let shares = 0;
  for (const doc of sessions.docs) {
    if (doc.id === STATS_SUMMARY_DOC_ID) continue;
    const session = doc.data() as Partial<WrappedStatsSession>;
    if (session.opened === true) opens++;
    if (session.completed === true) completions++;
    if (session.shareClicked === true) shares++;
  }

  const rate = (n: number) => Math.round((n / numberOfHackers) * 1000) / 1000;
  const summary: WrappedStatsSummary = {
    eventId: config.eventId,
    numberOfHackers,
    opens,
    completions,
    shares,
    openRate: rate(opens),
    completionRate: rate(completions),
    shareRate: rate(shares),
    lastAggregatedAt: new Date().toISOString(),
  };

  ui.info(`${numberOfHackers} decks generated`);
  for (const [label, count, ratio] of [
    ["opened", opens, summary.openRate],
    ["completed", completions, summary.completionRate],
    ["shared", shares, summary.shareRate],
  ] as const) {
    ui.info(`${`${count}`.padStart(6)} ${label.padEnd(10)} ${(ratio * 100).toFixed(1)}%`);
  }

  // Opting out after opening keeps the session doc but drops the deck on the next run.
  if (opens > numberOfHackers) {
    ui.warn(`${opens} opens against ${numberOfHackers} decks: rates exceed 100%.`);
  }
  if (completions > opens) {
    ui.warn(
      `${completions} completions against ${opens} opens: a session has completed without opened.`,
    );
  }

  await cache.writeJson("output/stats.json", summary);

  if (!config.writeToFirestore) {
    ui.info("Dry run: not writing WrappedStats/Summary.");
    return;
  }

  await eventRef.collection("WrappedStats").doc(STATS_SUMMARY_DOC_ID).set(summary);
  ui.success(`wrote Hackathons/${config.eventId}/WrappedStats/${STATS_SUMMARY_DOC_ID}`);
}

/**
 * Deletes every doc in `Hackathons/{eventId}/Wrapped` after a typed confirmation, and
 * resets the write stage in progress.json.
 */
export async function runDelete(ctx: RunContext): Promise<void> {
  const { config, db, ui, progress } = ctx;
  ui.section(`Delete: ${config.eventId} (${config.env})`);

  const collection = db.collection("Hackathons").doc(config.eventId).collection("Wrapped");
  const count = (await collection.count().get()).data().count;
  if (count === 0) {
    ui.info(`No docs in Hackathons/${config.eventId}/Wrapped.`);
    return;
  }
  if (!config.writeToFirestore) {
    ui.info(`writeToFirestore is off; would delete ${count} docs. Nothing deleted.`);
    return;
  }

  // Typing the event id (any case) is the confirmation; "n" backs out.
  const confirm = config.eventId.toLowerCase();
  const answer = await ui.prompt(
    `Delete all ${count} docs in ${config.env.toUpperCase()} Hackathons/${config.eventId}/Wrapped? ` +
      `Type "${confirm}" to confirm, or n to cancel.`,
    [confirm, "n"],
  );
  if (answer === "n") {
    ui.info("Cancelled; nothing deleted.");
    return;
  }

  await db.recursiveDelete(collection);
  ui.success(`Deleted ${count} docs`);

  // Saved by setStatus. A rerun of write then rewrites every doc.
  progress.state.writtenUids = [];
  await progress.setStatus("write", "pending");
}
