const assert = require('node:assert/strict');
const { test } = require('node:test');
const { load } = require('./load-ts.cjs');

const types = load('wrapped/types.ts');
const calc = load('wrapped/calc.ts', {
  'node:crypto': require('node:crypto'),
  './types.ts': types,
  '../src/lib/github-login.ts': load('src/lib/github-login.ts'),
  '../src/lib/wrapped/archetype-rules.ts': load('src/lib/wrapped/archetype-rules.ts'),
  '../src/lib/wrapped/tech-names.ts': load('src/lib/wrapped/tech-names.ts'),
});

const event = {
  eventId: 'e', name: 'e', checkInOpensAt: null,
  hackathonStart: '2026-11-01T17:00:00.000Z', hackathonEnd: '2026-11-02T17:00:00.000Z',
};
const commit = (committedAt, authorType = 'User') => ({
  sha: committedAt + authorType, committedAt, message: '', authorLogin: 'a', authorType,
});
const times = (...commits) => calc.lastCommitTimes(commits, event);
const early = commit('2026-11-02T14:00:00.000Z');

test('the submission time is the last in-window commit when nothing follows the deadline', () => {
  assert.deepEqual(times(early), {
    lastCommitAt: '2026-11-02T14:00:00.000Z', lastInWindowCommitAt: '2026-11-02T14:00:00.000Z',
  });
  assert.equal(calc.computeEarlySubmission(times(early), event), 3);
});

test('a commit within an hour after the deadline makes the submission time late', () => {
  const late = times(early, commit('2026-11-02T17:20:00.000Z'));
  assert.equal(late.lastCommitAt, '2026-11-02T17:20:00.000Z');
  assert.equal(late.lastInWindowCommitAt, '2026-11-02T14:00:00.000Z');
  assert.equal(calc.computeEarlySubmission(late, event), 0);
  // Exactly at the end of the grace window still counts.
  assert.equal(times(early, commit('2026-11-02T18:00:00.000Z')).lastCommitAt, '2026-11-02T18:00:00.000Z');
});

test('late bot commits and commits past the grace window are ignored', () => {
  assert.equal(times(early, commit('2026-11-02T17:20:00.000Z', 'Bot')).lastCommitAt, early.committedAt);
  assert.equal(times(early, commit('2026-11-02T18:00:01.000Z')).lastCommitAt, early.committedAt);
});

test('a commit exactly at the deadline is in the window', () => {
  const atEnd = times(early, commit('2026-11-02T17:00:00.000Z'));
  assert.equal(atEnd.lastInWindowCommitAt, '2026-11-02T17:00:00.000Z');
  assert.equal(atEnd.lastCommitAt, '2026-11-02T17:00:00.000Z');
});

test('no in-window commits gives no times, even with a late one', () => {
  const none = { lastCommitAt: null, lastInWindowCommitAt: null };
  assert.deepEqual(times(), none);
  assert.deepEqual(times(commit('2026-11-02T17:20:00.000Z')), none);
  assert.deepEqual(times(commit('2026-11-01T16:59:59.000Z')), none);
});

test('THE_FINISHER uses the last in-window commit, so a late fix does not cost it', () => {
  const hacker = {
    uid: 'u', lifetimeEventCount: 0, checkedInAt: null, claimedMidnightSnack: false,
    dayOfWorkshopCount: 0, mealCount: 0, dayOfActivityCount: 0,
  };
  const project = { teamSize: 3, memberUids: ['u'] };
  const enrichment = {
    ...times(commit('2026-11-02T16:58:00.000Z'), commit('2026-11-02T17:05:00.000Z')),
    teamCommitCount: null, commitsByUid: {},
  };
  const cohort = { submissionTimes: [], checkInOpensAt: null, deadline: event.hackathonEnd };
  assert.equal(calc.assignArchetype(hacker, project, enrichment, cohort), 'THE_FINISHER');
});
