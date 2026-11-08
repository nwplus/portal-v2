const assert = require('node:assert/strict');
const { test } = require('node:test');
const { load } = require('./load-ts.cjs');

const calc = load('wrapped/calc.ts', {
  'node:crypto': require('node:crypto'),
  './types.ts': load('wrapped/types.ts'),
  '../src/lib/github-login.ts': load('src/lib/github-login.ts'),
  '../src/lib/wrapped/archetype-rules.ts': load('src/lib/wrapped/archetype-rules.ts'),
});

const AT = '2026-11-05T00:00:00.000Z';
const rollup = (deckUids, sessions) =>
  calc.summarizeWrappedStats('e', deckUids, new Map(Object.entries(sessions)), AT);

const opened = { opened: true };
const completed = { opened: true, completed: true };

test('completion is a share of openers, not of decks', () => {
  const { summary } = rollup(['a', 'b', 'c', 'd'], { a: completed, b: opened });
  assert.equal(summary.openRate, 0.5);
  assert.equal(summary.completionRate, 0.5);
});

test('each rate is a share of the step before it', () => {
  const { summary } = rollup(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'], {
    a: { ...completed, shareClicked: true },
    b: completed,
    c: completed,
    d: completed,
    e: opened,
    f: opened,
    g: opened,
    h: opened,
  });
  assert.equal(summary.openRate, 0.8);
  assert.equal(summary.completionRate, 0.5);
  assert.equal(summary.shareRate, 0.25);
});

test('a session whose deck is gone is left out, so the open rate cannot pass 100%', () => {
  const { summary, orphanedSessions } = rollup(['a'], {
    a: opened,
    gone1: { ...completed, shareClicked: true },
    gone2: opened,
  });
  assert.deepEqual(summary, {
    eventId: 'e',
    numberOfHackers: 1,
    opens: 1,
    completions: 0,
    shares: 0,
    openRate: 1,
    completionRate: 0,
    shareRate: 0,
    lastAggregatedAt: AT,
  });
  assert.equal(orphanedSessions, 2);
});

test('a session missing an earlier step is reported, not counted, so no rate can pass 100%', () => {
  const { summary, skippedStepSessions } = rollup(['a', 'b', 'c', 'd'], {
    a: opened,
    b: { completed: true },
    c: { shareClicked: true },
    d: { opened: true, shareClicked: true },
  });
  assert.equal(summary.opens, 2);
  assert.equal(summary.completions, 0);
  assert.equal(summary.completionRate, 0);
  assert.equal(summary.shares, 0);
  assert.equal(summary.shareRate, 0);
  assert.equal(skippedStepSessions, 3);
});

test('a completer who did not share counts toward the share rate, not as a skipped step', () => {
  const { summary, skippedStepSessions } = rollup(['a', 'b'], {
    a: { ...completed, shareClicked: true },
    b: completed,
  });
  assert.equal(summary.shareRate, 0.5);
  assert.equal(skippedStepSessions, 0);
});

test('nobody having opened gives zero rates, not NaN', () => {
  const { summary } = rollup(['a', 'b'], {});
  assert.equal(summary.openRate, 0);
  assert.equal(summary.completionRate, 0);
  assert.equal(summary.shareRate, 0);
});

test('rates keep three decimals', () => {
  const { summary } = rollup(['a', 'b', 'c'], { a: opened });
  assert.equal(summary.openRate, 0.333);
});
