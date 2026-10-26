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

import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import {
  applyPrizes,
  assignArchetype,
  attributeCommits,
  attributeLines,
  buildArchetypeCohort,
  buildHacker,
  buildHackerLookups,
  buildWrappedDoc,
  buildNuggetInput,
  checkNuggetMessage,
  cleanAbout,
  computeCrossHackerComparison,
  countCommitLines,
  detectAiTools,
  filterToHackathonWindow,
  findStaleOverrides,
  isJunkAbout,
  isOptedOut,
  latestCommitAt,
  matchHackersToProjects,
  NUGGET_PROMPT_VERSION,
  nuggetCandidates,
  nuggetInputHash,
  nuggetSignals,
  summarizeMatch,
  topQuartileCommitCount,
  validateNuggetResult,
} from "./calc.ts";
import type { MatchReport } from "./calc.ts";
import type { RunContext } from "./infra.ts";
import {
  collectNuggetBatch,
  fetchAttendance,
  fetchAttendingApplicants,
  fetchCommitDetail,
  fetchDayOfSchedule,
  fetchEventInfo,
  fetchGithubRateLimit,
  fetchPreHackathonWorkshops,
  fetchRepoCommits,
  fetchSocials,
  fetchStamps,
  isCommitDetailCached,
  parseDevpostCsv,
  submitNuggetBatch,
} from "./sources.ts";
import type { NuggetRequest } from "./sources.ts";
import { STAGE_SCHEMA_VERSION, STAGES } from "./types.ts";
import type {
  AssembleOutput,
  EnrichOutput,
  EventInfo,
  FetchOutput,
  MatchOutput,
  MatchOverrides,
  NuggetPath,
  NuggetReviewItem,
  NuggetStore,
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

  // Dropped before anything else reads them, so they're in no cohort figure.
  const included: RawApplicant[] = [];
  const optedOutEmails: string[] = [];
  for (const applicant of applicants) {
    const social = socialByUid.get(applicant.uid);
    if (!isOptedOut(social)) {
      included.push(applicant);
      continue;
    }
    for (const email of [applicant.basicInfo?.email, social?.email]) {
      if (email) optedOutEmails.push(email.trim().toLowerCase());
    }
  }
  ui.info(`${applicants.length - included.length} opted out, ${included.length} remaining`);

  const [dayOf, attendance, stamps, preHackathonWorkshops] = await Promise.all([
    fetchDayOfSchedule(ctx),
    fetchAttendance(ctx),
    fetchStamps(ctx),
    fetchPreHackathonWorkshops(ctx),
  ]);
  ui.info(
    `${dayOf.length} DayOf items, ${attendance.length} attendance records, ` +
      `${stamps.length} stamps, ${preHackathonWorkshops.length} pre-hackathon workshops`,
  );

  const lookups = buildHackerLookups(event.eventId, dayOf, attendance, stamps, preHackathonWorkshops);
  const hackers = included.map((applicant) =>
    buildHacker(applicant, socialByUid.get(applicant.uid), lookups),
  );

  const devpostRows = await parseDevpostCsv(ctx);
  ui.success(`${devpostRows.length} projects parsed`);

  await ctx.cache.writeStage<FetchOutput>("fetch", {
    event,
    hackers,
    optedOutEmails: [...new Set(optedOutEmails)],
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
  const { hackers, devpostRows, optedOutEmails } = await cache.readStage<FetchOutput>("fetch");

  for (;;) {
    const overrides = { ...EMPTY_OVERRIDES, ...(await cache.readJson("overrides.json", EMPTY_OVERRIDES)) };
    for (const problem of findStaleOverrides(overrides, hackers, devpostRows)) ui.warn(problem);

    const match = matchHackersToProjects(hackers, devpostRows, overrides);
    const report = summarizeMatch(match, hackers, devpostRows, optedOutEmails);
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
  const listed: Array<{ project: Project; readable: boolean; inWindow: RawCommit[] }> = [];
  // The first repo each sha was listed in; a fork's copy has the same stats.
  const repoBySha = new Map<string, RepoRef>();
  const projectBar = ui.bar("Projects", projects.length);
  let unreadableRepos = 0;

  for (const project of projects) {
    const perRepo: RawCommit[][] = [];
    for (const repo of project.repos) {
      const commits = await fetchRepoCommits(ctx, repo, event.hackathonStart);
      if (commits === null) {
        unreadableRepos++;
        continue;
      }
      perRepo.push(commits);
      for (const commit of commits) if (!repoBySha.has(commit.sha)) repoBySha.set(commit.sha, repo);
    }

    // One repo linked twice under different names, or a fork, must not double-count.
    const unique = new Map(perRepo.flat().map((commit) => [commit.sha, commit]));
    listed.push({
      project,
      readable: perRepo.length > 0,
      inWindow: filterToHackathonWindow([...unique.values()], event),
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
  for (const { project, readable, inWindow } of listed) {
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
      lastCommitAt: latestCommitAt(inWindow),
      aiTools: detectAiTools(inWindow),
      // Filled below, once every project's commits are in.
      nugget: null,
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

  // 5. Cohort-wide (the commit quartile), so after the loop.
  const store = await generateNuggets(ctx, projects, byProject, event);
  await reviewNuggets(ctx, projects, store);
  for (const project of projects) byProject[project.id].nugget = store[project.id]?.message ?? null;

  await ctx.cache.writeStage<EnrichOutput>("enrich", { schemaVersion: STAGE_SCHEMA_VERSION, byProject });
}

const NUGGET_STORE = "nuggets.json";
const NUGGET_PENDING = "nugget-batch.json";
const NUGGET_REVIEW = "output/nugget-review.json";

/** A submitted batch not yet merged into the store, so an interrupted run resumes polling. */
interface PendingNuggetBatch {
  batchId: string;
  requests: Record<string, { projectId: string; inputHash: string; candidates: NuggetPath[] }>;
}

/**
 * Returns the store with an entry for every project whose About isn't junk. Reuses entries
 * whose promptVersion and inputHash match, then generates the rest in one Message Batch.
 * Junk About gets no entry and no call, so its slide is hidden.
 */
async function generateNuggets(
  ctx: RunContext,
  projects: Project[],
  byProject: Record<string, ProjectEnrichment>,
  event: EventInfo,
): Promise<NuggetStore> {
  const { cache, ui } = ctx;
  // Not a raw/ entry: bypassCache must not discard reviewed messages.
  const store = await cache.readJson<NuggetStore>(NUGGET_STORE, {});
  const quartile = topQuartileCommitCount(Object.values(byProject));

  const wanted = new Map<string, NuggetRequest & { projectId: string; inputHash: string }>();
  let junk = 0;
  for (const project of projects) {
    const about = cleanAbout(project.about);
    if (isJunkAbout(about, project.title)) {
      junk++;
      delete store[project.id];
      continue;
    }
    const signals = nuggetSignals(project, byProject[project.id], event, quartile);
    const input = buildNuggetInput(project, about, signals);
    const inputHash = nuggetInputHash(input);
    const entry = store[project.id];
    if (entry?.promptVersion === NUGGET_PROMPT_VERSION && entry.inputHash === inputHash) continue;
    // custom_id allows [a-zA-Z0-9_-]{1,64}; Devpost URLs don't fit.
    const customId = createHash("sha256").update(project.id).digest("hex").slice(0, 32);
    const candidates = nuggetCandidates(project.id, signals);
    wanted.set(project.id, { customId, input, candidates, projectId: project.id, inputHash });
  }

  const reused = projects.length - junk - wanted.size;
  ui.info(`Nugget: ${reused} stored, ${wanted.size} to generate, ${junk} with no usable About (slide hidden)`);

  // Held back for a later run: no entry, so the slide is hidden until then.
  const { nuggetLimit } = ctx.config;
  // A total, so rerunning doesn't creep past it: stored messages count against it.
  const allowed = nuggetLimit === null ? Infinity : Math.max(nuggetLimit - reused, 0);
  if (wanted.size > allowed) {
    // The longest About texts first: the most informative sample of the prompt.
    const heldBack = [...wanted.values()]
      .sort((a, b) => b.input.about.length - a.input.about.length)
      .slice(allowed);
    for (const { projectId } of heldBack) {
      wanted.delete(projectId);
      delete store[projectId];
    }
    ui.warn(`nuggetLimit ${nuggetLimit}: generating ${allowed}; the rest stay null until a run without the limit`);
  }

  const merge = async (pending: PendingNuggetBatch) => {
    const responses = await collectNuggetBatch(ctx, pending.batchId);
    for (const [customId, request] of Object.entries(pending.requests)) {
      const current = wanted.get(request.projectId);
      // Inputs changed since this batch was submitted; its answer is for an old question.
      if (current?.inputHash !== request.inputHash) continue;
      const response = responses.get(customId) ?? { error: "missing from batch results" };
      const result =
        "error" in response
          ? ({ ok: false, reason: response.error } as const)
          : validateNuggetResult(response.text, response.stopReason, current.candidates, current.input);
      store[request.projectId] = {
        path: result.ok ? result.path : null,
        message: result.ok ? result.message : null,
        source: result.ok ? "llm" : "failed",
        flags: result.ok ? result.flags : [result.reason],
        promptVersion: NUGGET_PROMPT_VERSION,
        inputHash: request.inputHash,
        reviewed: false,
        createdAt: new Date().toISOString(),
      };
      wanted.delete(request.projectId);
    }
    await cache.writeJson(NUGGET_STORE, store);
    await fs.rm(path.join(cache.dir, NUGGET_PENDING), { force: true });
  };

  const pending = await cache.readJson<PendingNuggetBatch | null>(NUGGET_PENDING, null);
  if (pending) {
    ui.info(`Resuming Nugget batch ${pending.batchId}`);
    await merge(pending);
  }

  if (wanted.size > 0) {
    const requests = [...wanted.values()];
    const batchId = await submitNuggetBatch(requests);
    ui.info(`Submitted Nugget batch ${batchId} (${requests.length} projects)`);
    const submitted: PendingNuggetBatch = {
      batchId,
      requests: Object.fromEntries(
        requests.map((r) => [r.customId, { projectId: r.projectId, inputHash: r.inputHash, candidates: r.candidates }]),
      ),
    };
    await cache.writeJson(NUGGET_PENDING, submitted);
    await merge(submitted);
  }

  const failed = projects.filter((p) => store[p.id]?.source === "failed").length;
  if (failed > 0) ui.warn(`${failed} Nugget messages failed; write them in review or leave them blank`);
  await cache.writeJson(NUGGET_STORE, store);
  return store;
}

/**
 * The organizer review pause. Writes every current message to output/nugget-review.json
 * and waits. Edits are checked against the same rules as the model's output; a changed
 * message becomes source "override" and a blank one hides the slide. Prod can't continue
 * past unreviewed messages; dev can [s]kip and use them as they are.
 */
async function reviewNuggets(ctx: RunContext, projects: Project[], store: NuggetStore): Promise<void> {
  const { cache, config, ui } = ctx;
  const current = projects.filter((project) => store[project.id]);
  if (current.every((project) => store[project.id].reviewed)) {
    if (current.length > 0) ui.success(`${current.length} Nugget messages, all reviewed`);
    return;
  }

  // Edits from an earlier, aborted review survive until that message is regenerated.
  const previous = new Map(
    (await cache.readJson<NuggetReviewItem[]>(NUGGET_REVIEW, [])).map((item) => [item.projectId, item]),
  );
  const items: NuggetReviewItem[] = current
    .map((project) => {
      const entry = store[project.id];
      const earlier = previous.get(project.id);
      return {
        projectId: project.id,
        title: project.title,
        path: entry.path,
        message: earlier?.generatedAt === entry.createdAt ? earlier.message : (entry.message ?? ""),
        source: entry.source,
        reviewed: entry.reviewed,
        flags: entry.flags,
        about: cleanAbout(project.about).slice(0, 400),
        generatedAt: entry.createdAt,
      };
    })
    // Unreviewed first, flagged first within them.
    .sort((a, b) => Number(a.reviewed) - Number(b.reviewed) || b.flags.length - a.flags.length);
  await cache.writeJson(NUGGET_REVIEW, items);

  const unreviewed = items.filter((item) => !item.reviewed);
  const paths = new Map<string, number>();
  for (const item of items) paths.set(item.path ?? "none", (paths.get(item.path ?? "none") ?? 0) + 1);
  ui.warn(`${unreviewed.length}/${items.length} Nugget messages need review`);
  ui.info(`paths: ${[...paths].map(([p, n]) => `${p} ${n}`).join(", ")}`);
  for (const item of unreviewed.slice(0, REPORT_PREVIEW)) {
    ui.info(`${item.title}: ${item.message || "(none)"}${item.flags.length ? `  [${item.flags.join("; ")}]` : ""}`);
  }
  if (unreviewed.length > REPORT_PREVIEW) ui.info(`… ${unreviewed.length - REPORT_PREVIEW} more`);
  ui.info(`Edit messages in ${cache.dir}/${NUGGET_REVIEW}; a blank message hides the slide.`);

  const choices = config.env === "prod" ? (["c", "a"] as const) : (["c", "s", "a"] as const);
  for (;;) {
    const question =
      config.env === "prod"
        ? "[c]ontinue (marks every message reviewed), [a]bort?"
        : "[c]ontinue (marks every message reviewed), [s]kip review on dev, [a]bort?";
    const choice = await ui.prompt(question, choices);
    if (choice === "a") throw new Error("Nugget review aborted; progress stays at enrich.");
    if (choice === "s") return;

    const edited = await cache.readJson<NuggetReviewItem[]>(NUGGET_REVIEW, items);
    const problems = edited.flatMap((item) => {
      const errors = checkNuggetMessage(item.message.trim());
      return errors.length > 0 ? [`${item.title}: ${errors.join(", ")}`] : [];
    });
    if (problems.length > 0) {
      for (const problem of problems) ui.warn(problem);
      continue;
    }

    let overrides = 0;
    for (const item of edited) {
      const entry = store[item.projectId];
      if (!entry) continue;
      const message = item.message.trim() || null;
      if (message !== entry.message) {
        entry.message = message;
        entry.source = "override";
        overrides++;
      }
      entry.reviewed = true;
    }
    await cache.writeJson(NUGGET_STORE, store);
    ui.success(`${edited.length} Nugget messages reviewed, ${overrides} edited`);
    return;
  }
}

// ---------------------------------------------------------------------------
// 4. assemble: everything -> WrappedDoc per hacker. Local only.
// ---------------------------------------------------------------------------

async function stageAssemble(ctx: RunContext): Promise<void> {
  const { event, hackers } = await ctx.cache.readStage<FetchOutput>("fetch");
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
    ["project.nugget", (doc) => doc.project?.nugget],
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
