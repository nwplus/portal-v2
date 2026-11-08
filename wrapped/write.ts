/**
 * The write run: five stages, each reading the previous stage's output from
 * cache/{env}/{eventId}/stages/ and writing its own.
 *
 *   fetch -> match -> enrich -> assemble -> write
 *            ^         ^         ^
 *            checkpoints (--from)
 *
 * Without --from the run resumes at the first stage progress.json does not mark done.
 */


import {
  applyPrizes,
  assignArchetype,
  attributeCommits,
  attributeLines,
  buildArchetypeCohort,
  buildHacker,
  buildHackerLookups,
  buildWrappedDoc,
  computeCrossHackerComparison,
  countCommitLines,
  detectAiTools,
  filterToHackathonWindow,
  findStaleOverrides,
  isCheckedIn,
  isOptedOut,
  lastCommitTimes,
  matchHackersToProjects,
  summarizeMatch,
} from "./calc.ts";
import type { MatchReport } from "./calc.ts";
import type { RunContext } from "./infra.ts";
import {
  fetchAttendance,
  fetchAttendingApplicants,
  fetchCommitDetail,
  fetchEventInfo,
  fetchGithubRateLimit,
  fetchRepoCommits,
  fetchSocials,
  fetchStamps,
  isCommitDetailCached,
  parseDevpostCsv,
} from "./sources.ts";
import { STAGE_SCHEMA_VERSION, STAGES, STAMP_CATEGORIES } from "./types.ts";
import type {
  AssembleOutput,
  EnrichOutput,
  EventInfo,
  FetchOutput,
  MatchOutput,
  MatchOverrides,
  Project,
  ProjectEnrichment,
  RawApplicant,
  RawCommit,
  RawCommitDetail,
  RepoRef,
  RestartPoint,
  Stage,
  WrappedDoc,
} from "./types.ts";

const STAGE_RUNNERS: Record<Stage, (ctx: RunContext) => Promise<void>> = {
  fetch: stageFetch,
  match: stageMatch,
  enrich: stageEnrich,
  assemble: stageAssemble,
  write: stageWrite,
};

export async function runWrite(ctx: RunContext, from: RestartPoint | undefined) {
  const start = ctx.progress.resolveStart(from);

  for (const [i, stage] of STAGES.entries()) {
    if (STAGES.indexOf(stage) < STAGES.indexOf(start)) continue;

    ctx.ui.section(`[${i + 1}/${STAGES.length}] ${stage}`);
    await ctx.progress.setStatus(stage, "running");
    await STAGE_RUNNERS[stage](ctx);
    // stageWrite sets "skipped" itself when writeToFirestore is off.
    if (ctx.progress.state.stages[stage].status === "running") {
      await ctx.progress.setStatus(stage, "done");
    }
  }
}

// ---------------------------------------------------------------------------
// 1. fetch: Firestore + Devpost CSV -> FetchOutput
// ---------------------------------------------------------------------------

async function stageFetch(ctx: RunContext): Promise<void> {
  const { ui } = ctx;
  const event = await fetchEventInfo(ctx);
  ui.info(`${event.name}: ${event.hackathonStart} to ${event.hackathonEnd}`);

  const applicants = await fetchAttendingApplicants(ctx);
  ui.success(`Firestore fetch complete! ${applicants.length} hackers recorded`);

  const socials = await fetchSocials(
    ctx,
    applicants.map((applicant) => applicant.uid),
  );
  const socialByUid = new Map(socials.map((social) => [social.uid, social]));

  // Dropped before anything else reads them, so they're in no cohort figure. No-shows get
  // no deck: the deck thanks the hacker for coming, and admin-v2 emails checked-in
  // hackers only, so both lists must be the same.
  const included: RawApplicant[] = [];
  const excludedEmails: string[] = [];
  let optedOut = 0;
  let notCheckedIn = 0;
  for (const applicant of applicants) {
    const social = socialByUid.get(applicant.uid);
    if (isOptedOut(social)) optedOut++;
    else if (!isCheckedIn(applicant)) notCheckedIn++;
    else {
      included.push(applicant);
      continue;
    }
    for (const email of [applicant.basicInfo?.email, social?.email]) {
      if (email) excludedEmails.push(email.trim().toLowerCase());
    }
  }
  ui.info(`${optedOut} opted out, ${notCheckedIn} not checked in, ${included.length} remaining`);
  if (included.length === 0) {
    throw new Error(
      `No checked-in hackers in Hackathons/${event.eventId}/Applicants (dayOf.checkedIn). ` +
        "Run after check-in, or rerun with bypassCache if raw/applicants.json predates it.",
    );
  }

  const [attendance, stamps] = await Promise.all([fetchAttendance(ctx), fetchStamps(ctx)]);
  const byCategory = STAMP_CATEGORIES.map(
    (category) => `${category} ${stamps.filter((stamp) => (stamp.category ?? "other") === category).length}`,
  );
  ui.info(`${attendance.length} attendance records, ${stamps.length} stamps: ${byCategory.join(", ")}`);
  // A raw/stamps.json cached before `category` was read gives every hacker 0 attendance.
  if (stamps.length > 0 && stamps.every((stamp) => !stamp.category)) {
    ui.warn("No stamp has a category; raw/stamps.json may be stale. Rerun with bypassCache on.");
  }
  // An id with no Stamps doc for this event (e.g. a stamp missing its `hackathon`) counts nowhere.
  const knownStampIds = new Set(stamps.map((stamp) => stamp.id));
  const unknownStampIds = new Set(
    included
      .flatMap((applicant) => socialByUid.get(applicant.uid)?.unlockedStamps?.[event.eventId] ?? [])
      .filter((id) => !knownStampIds.has(id)),
  );
  if (unknownStampIds.size > 0) {
    ui.warn(`${unknownStampIds.size} unlocked stamp ids match no ${event.eventId} stamp; they count nowhere`);
  }

  const lookups = buildHackerLookups(event.eventId, attendance, stamps);
  const hackers = included.map((applicant) =>
    buildHacker(applicant, socialByUid.get(applicant.uid), lookups),
  );

  const devpostRows = await parseDevpostCsv(ctx);
  ui.success(`${devpostRows.length} projects parsed`);

  await ctx.cache.writeStage<FetchOutput>("fetch", {
    schemaVersion: STAGE_SCHEMA_VERSION,
    event,
    hackers,
    excludedEmails: [...new Set(excludedEmails)],
    devpostRows,
  });
}

// ---------------------------------------------------------------------------
// 2. match: Devpost rows <-> hackers -> MatchOutput. Pauses for review.
// ---------------------------------------------------------------------------

const EMPTY_OVERRIDES: MatchOverrides = { emailToUid: {}, uidToProject: {} };

/** Items printed per report list; the full lists are in match-report.json. */
const REPORT_PREVIEW = 10;

async function stageMatch(ctx: RunContext): Promise<void> {
  const { ui, cache } = ctx;
  const { hackers, devpostRows, excludedEmails } = await cache.readStage<FetchOutput>("fetch");

  for (;;) {
    const overrides = { ...EMPTY_OVERRIDES, ...(await cache.readJson("overrides.json", EMPTY_OVERRIDES)) };
    for (const problem of findStaleOverrides(overrides, hackers, devpostRows)) ui.warn(problem);

    const match = matchHackersToProjects(hackers, devpostRows, overrides);
    const report = summarizeMatch(match, hackers, devpostRows, excludedEmails ?? []);
    await cache.writeJson("match-report.json", report);
    printMatchReport(ctx, report, hackers.length);

    const choice = await ui.prompt("[c]ontinue, [r]e-match after editing overrides.json, [a]bort?", [
      "c",
      "r",
      "a",
    ] as const);
    if (choice === "a") throw new Error("Match aborted; progress stays at match.");
    if (choice === "c") {
      await cache.writeStage<MatchOutput>("match", match);
      return;
    }
  }
}

function printMatchReport(ctx: RunContext, report: MatchReport, hackerCount: number) {
  const { ui } = ctx;
  ui.success(`${report.matchedHackers}/${hackerCount} hackers matched to ${report.projects} projects`);

  const list = <T>(title: string, items: T[], format: (item: T) => string) => {
    if (items.length === 0) return;
    ui.warn(`${title}: ${items.length}`);
    for (const item of items.slice(0, REPORT_PREVIEW)) ui.info(format(item));
    if (items.length > REPORT_PREVIEW) ui.info(`… ${items.length - REPORT_PREVIEW} more`);
  };

  list("Hackers with no project", report.hackersWithoutProject, (h) => `${h.name} ${h.uid} ${h.emails.join(", ")}`);
  list("Rows no one matched", report.orphanRows, (row) => `${row.title}: ${row.emails.join(", ")}`);
  list("Unmatched emails on matched rows", report.unmatchedEmails, (e) => `${e.title}: ${e.email}`);
  list(
    "Hackers on more than one row",
    report.multiProjectHackers,
    (h) => `${h.uid}: ${h.titles.join(" | ")} -> ${h.assigned ?? "none"}`,
  );
  ui.info(`Full report: ${ctx.cache.dir}/match-report.json`);
}

// ---------------------------------------------------------------------------
// 3. enrich: GitHub + AI, per project -> EnrichOutput
// ---------------------------------------------------------------------------

/** Commit-stat requests in flight at once. */
const COMMIT_DETAIL_CONCURRENCY = 6;

async function stageEnrich(ctx: RunContext): Promise<void> {
  const { ui } = ctx;
  const { event, hackers } = await ctx.cache.readStage<FetchOutput>("fetch");
  const { projects } = await ctx.cache.readStage<MatchOutput>("match");
  const hackerByUid = new Map(hackers.map((hacker) => [hacker.uid, hacker]));

  // 1. Per project: commit lists (cached per repo, so a halt loses at most one repo).
  const listed: Array<{
    project: Project;
    readable: boolean;
    inWindow: RawCommit[];
    times: ReturnType<typeof lastCommitTimes>;
  }> = [];
  // The first repo each sha was listed in; a fork's copy has the same stats.
  const repoBySha = new Map<string, RepoRef>();
  const projectBar = ui.bar("Projects", projects.length);
  let unreadableRepos = 0;

  for (const project of projects) {
    const perRepo: RawCommit[][] = [];
    for (const repo of project.repos) {
      const commits = await fetchRepoCommits(ctx, repo, event);
      if (commits === null) {
        unreadableRepos++;
        continue;
      }
      perRepo.push(commits);
      for (const commit of commits) if (!repoBySha.has(commit.sha)) repoBySha.set(commit.sha, repo);
    }

    // One repo linked twice under different names, or a fork, must not double-count.
    const unique = [...new Map(perRepo.flat().map((commit) => [commit.sha, commit])).values()];
    listed.push({
      project,
      readable: perRepo.length > 0,
      inWindow: filterToHackathonWindow(unique, event),
      times: lastCommitTimes(unique, event),
    });
    projectBar.tick();
  }
  projectBar.stop();

  // 2. Preflight: only uncached stats cost requests. Pages past 300 files cost more, rarely.
  const counted = (commits: RawCommit[]) => commits.filter((commit) => commit.authorType !== "Bot");
  const shas = [...new Set(listed.flatMap(({ inWindow }) => counted(inWindow).map((commit) => commit.sha)))];
  const cached = await Promise.all(shas.map((sha) => isCommitDetailCached(ctx, sha)));
  const uncached = cached.filter((hit) => !hit).length;
  if (uncached > 0) {
    const limit = await fetchGithubRateLimit();
    ui.info(`${shas.length} commits, ${uncached} stats not cached; ${limit.remaining} GitHub requests left`);
    if (limit.remaining < uncached) {
      const reset = new Date(limit.reset).toLocaleTimeString();
      ui.warn(
        `Not enough GitHub requests for every commit; the limit resets at ${reset}. ` +
          "Continuing stops at the limit; rerun after the reset to resume from the cache.",
      );
      const choice = await ui.prompt("[c]ontinue / [a]bort?", ["c", "a"] as const);
      if (choice === "a") throw new Error("Enrich aborted before commit stats; progress stays at enrich.");
    }
  }

  // 3. Commit stats, a few at a time. Cached per sha, so a halt loses only those in flight.
  const details = new Map<string, RawCommitDetail | null>();
  const statsBar = ui.bar("Commit stats", shas.length);
  let next = 0;
  let failed = false;
  const worker = async () => {
    while (!failed && next < shas.length) {
      const sha = shas[next++];
      try {
        details.set(sha, await fetchCommitDetail(ctx, repoBySha.get(sha)!, sha));
      } catch (error) {
        // The others stop taking new shas; the rate-limit message reaches the user.
        failed = true;
        throw error;
      }
      statsBar.tick();
      await ctx.progress.tick("enrich", details.size, shas.length);
    }
  };
  await Promise.all(Array.from({ length: COMMIT_DETAIL_CONCURRENCY }, worker));
  statsBar.stop();
  const linesBySha = new Map([...details].map(([sha, detail]) => [sha, countCommitLines(detail)]));

  // 4. Per project: attribution from the commits and stats above.
  const byProject: Record<string, ProjectEnrichment> = {};
  for (const { project, readable, inWindow, times } of listed) {
    const members = project.memberUids.flatMap((uid) => hackerByUid.get(uid) ?? []);
    // No readable repo: every count is unknown, not zero, so no member enters the ranking.
    byProject[project.id] = {
      projectId: project.id,
      ...(readable
        ? { ...attributeCommits(inWindow, members), ...attributeLines(inWindow, linesBySha, members) }
        : {
            teamCommitCount: null,
            commitsByUid: {},
            unattributedCommitCount: 0,
            teamLineCount: null,
            linesByUid: {},
          }),
      unreadableCommitStats: counted(inWindow).filter((commit) => details.get(commit.sha) === null).length,
      ...times,
      aiTools: detectAiTools(inWindow),
    };
  }

  const repoCount = projects.reduce((sum, project) => sum + project.repos.length, 0);
  const enrichments = Object.values(byProject);
  const withCommits = enrichments.filter((e) => e.teamCommitCount).length;
  const totalLines = enrichments.reduce((sum, e) => sum + (e.teamLineCount ?? 0), 0);
  const noStats = [...details.values()].filter((detail) => detail === null).length;
  ui.success(
    `${projects.length} projects enriched: ${repoCount} repos (${unreadableRepos} private or missing), ` +
      `${withCommits} projects with in-window commits, ${totalLines.toLocaleString()} lines ` +
      `(${noStats}/${shas.length} commits with no readable stats)`,
  );

  await ctx.cache.writeStage<EnrichOutput>("enrich", { schemaVersion: STAGE_SCHEMA_VERSION, byProject });
}

// ---------------------------------------------------------------------------
// 4. assemble: everything -> WrappedDoc per hacker. Local only.
// ---------------------------------------------------------------------------

async function stageAssemble(ctx: RunContext): Promise<void> {
  const fetched = await ctx.cache.readStage<FetchOutput>("fetch");
  if (fetched.schemaVersion !== STAGE_SCHEMA_VERSION) {
    throw new Error("stages/fetch.json is from an older schema; run pnpm wrapped write --from fetch");
  }
  const { event, hackers } = fetched;
  const match = await ctx.cache.readStage<MatchOutput>("match");
  const enrich = await ctx.cache.readStage<EnrichOutput>("enrich");
  if (enrich.schemaVersion !== STAGE_SCHEMA_VERSION) {
    throw new Error("stages/enrich.json is from an older schema; run pnpm wrapped write --from enrich");
  }
  const { byProject } = enrich;
  const projectById = new Map(match.projects.map((project) => [project.id, project]));

  // Cohort-wide values first; each per-hacker rule only compares against these.
  const cohort = buildArchetypeCohort(hackers, match, byProject, event);
  const comparisons = computeCrossHackerComparison(
    hackers,
    Object.assign({}, ...Object.values(byProject).map((e) => e.linesByUid)),
  );

  const generatedAt = new Date().toISOString();
  const docs: Record<string, WrappedDoc> = {};
  for (const hacker of hackers) {
    const projectId = match.projectByUid[hacker.uid];
    const project = projectId ? projectById.get(projectId) : undefined;
    const enrichment = projectId ? byProject[projectId] : undefined;
    docs[hacker.uid] = buildWrappedDoc({
      event,
      hacker,
      project,
      enrichment,
      archetype: assignArchetype(hacker, project, enrichment, cohort),
      comparison: comparisons[hacker.uid],
      generatedAt,
    });
  }

  await ctx.cache.writeStage<AssembleOutput>("assemble", { schemaVersion: STAGE_SCHEMA_VERSION, docs });
  await ctx.cache.writeJson("output/docs.json", docs);
  printDocSummary(ctx, Object.values(docs));
  ctx.ui.info(`Review ${ctx.cache.dir}/output/docs.json before writing.`);
}

/** Null counts per nullable field and the archetype spread, to spot a broken input. */
function printDocSummary(ctx: RunContext, docs: WrappedDoc[]) {
  const nullable: Array<[string, (doc: WrappedDoc) => unknown]> = [
    ["project", (doc) => doc.project],
    ["project.githubTeamLineCount", (doc) => doc.project?.githubTeamLineCount],
    ["project.githubLineCount", (doc) => doc.project?.githubLineCount],
    ["crossHackerComparison.lines", (doc) => doc.crossHackerComparison.lines],
    ["crossHackerComparison.stamps", (doc) => doc.crossHackerComparison.stamps],
    ["crossHackerComparison.events", (doc) => doc.crossHackerComparison.events],
    ["survival", (doc) => doc.survival],
    ["earlySubmission", (doc) => doc.earlySubmission],
  ];
  ctx.ui.success(`${docs.length} docs assembled`);
  for (const [field, get] of nullable) {
    const nulls = docs.filter((doc) => get(doc) == null).length;
    ctx.ui.info(`${field}: ${nulls}/${docs.length} null`);
  }

  const archetypes = new Map<string, number>();
  for (const doc of docs) archetypes.set(doc.archetype, (archetypes.get(doc.archetype) ?? 0) + 1);
  ctx.ui.info(
    `archetypes: ${[...archetypes].map(([id, count]) => `${id} ${count}`).join(", ")}`,
  );

  const featured = new Map<string, number>(["lines", "stamps", "events", "none"].map((stat) => [stat, 0]));
  for (const doc of docs) {
    const stat = doc.crossHackerComparison.featured ?? "none";
    featured.set(stat, featured.get(stat)! + 1);
  }
  ctx.ui.info(`featured: ${[...featured].map(([stat, count]) => `${stat} ${count}`).join(", ")}`);
}

// ---------------------------------------------------------------------------
// 5. write: WrappedDoc -> Hackathons/{eventId}/Wrapped/{uid}
// ---------------------------------------------------------------------------

/** Under Firestore's 500-write batch limit. */
const WRITE_BATCH_SIZE = 450;

async function stageWrite(ctx: RunContext): Promise<void> {
  const assembled = await ctx.cache.readStage<AssembleOutput>("assemble");
  // A plain resume skips a done assemble; without this it would push old-shape docs.
  if (assembled.schemaVersion !== STAGE_SCHEMA_VERSION) {
    throw new Error("stages/assemble.json is from an older schema; run pnpm wrapped write --from assemble");
  }

  if (!ctx.config.writeToFirestore) {
    ctx.ui.info("writeToFirestore is off; skipping. Docs are in output/docs.json.");
    await ctx.progress.setStatus("write", "skipped");
    return;
  }

  const { config, db, ui, progress } = ctx;
  const { docs } = assembled;
  const written = new Set(progress.state.writtenUids);
  const pending = Object.entries(docs).filter(([uid]) => !written.has(uid));
  if (written.size > 0) ui.info(`${written.size} docs already written; ${pending.length} left`);

  const collection = db.collection("Hackathons").doc(config.eventId).collection("Wrapped");
  // Docs from an earlier run for hackers no longer in the run (opted out since, or no
  // longer attending). Without this an opt-out never removes an existing deck.
  const stale = (await collection.listDocuments()).filter((ref) => !Object.hasOwn(docs, ref.id));
  if (pending.length === 0 && stale.length === 0) return;

  if (config.env === "prod") {
    const answer = await ui.prompt(
      `Write ${pending.length} docs to PROD Hackathons/${config.eventId}/Wrapped` +
        `${stale.length ? ` and delete ${stale.length} stale ones` : ""}?`,
      ["y", "n"] as const,
    );
    if (answer === "n") throw new Error("Write cancelled; nothing written.");
  }

  for (let i = 0; i < stale.length; i += WRITE_BATCH_SIZE) {
    const batch = db.batch();
    for (const ref of stale.slice(i, i + WRITE_BATCH_SIZE)) batch.delete(ref);
    await batch.commit();
  }
  if (stale.length > 0) ui.success(`${stale.length} stale docs deleted (hackers no longer in the run)`);
  if (pending.length === 0) return;

  const bar = ui.bar("Writing", pending.length);
  let carried = 0;

  for (let i = 0; i < pending.length; i += WRITE_BATCH_SIZE) {
    const chunk = pending.slice(i, i + WRITE_BATCH_SIZE);
    const refs = chunk.map(([uid]) => collection.doc(uid));
    // Prizes come from the prize run, not from this run's inputs; carry them over.
    const existing = await db.getAll(...refs, { fieldMask: ["prize"] });

    const batch = db.batch();
    for (const [j, [, doc]] of chunk.entries()) {
      const prize = existing[j].get("prize");
      const hasPrize = Array.isArray(prize) && prize.length > 0;
      if (hasPrize) carried++;
      // No merge: fields dropped from the schema disappear.
      batch.set(refs[j], hasPrize ? applyPrizes(doc, prize) : doc);
    }
    await batch.commit();

    await progress.markWritten(chunk.map(([uid]) => uid));
    bar.tick(chunk.length);
  }

  bar.stop();
  ui.success(`${pending.length} docs written${carried ? `, ${carried} kept their prizes` : ""}`);
}
