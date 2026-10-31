const assert = require('node:assert/strict');
const { test } = require('node:test');
const { load } = require('./load-ts.cjs');

const points = load('src/lib/points.ts');
const stampbook = load('src/lib/stampbook.ts');

test('stamp value is the floored points, or 1 when missing or invalid', () => {
  assert.equal(points.stampPointValue({ points: 5 }), 5);
  assert.equal(points.stampPointValue({ points: 2.9 }), 2);
  assert.equal(points.stampPointValue({ points: 0 }), 0);
  assert.equal(points.stampPointValue({}), 1);
  assert.equal(points.stampPointValue({ points: -1 }), 1);
  assert.equal(points.stampPointValue({ points: Number.NaN }), 1);
  assert.equal(points.stampPointValue({ points: Number.POSITIVE_INFINITY }), 1);
  assert.equal(points.stampPointValue({ points: '5' }), 1);
});

test('hacker points sum distinct stamps and CTF solves', () => {
  const stamps = [{ _id: 'a', points: 5 }, { _id: 'b' }, { _id: 'c', points: 0 }];
  assert.equal(points.hackerPoints(['a', 'b', 'c'], stamps, []), 6);
  assert.equal(points.hackerPoints(['a', 'a', 'b'], stamps, []), 6);
  assert.equal(points.hackerPoints(['a', 'deleted'], stamps, []), 5);
  assert.equal(points.hackerPoints(['a'], stamps, [{ points: 10 }, { points: 7 }]), 22);
  assert.equal(points.hackerPoints([], stamps, []), 0);
});

test('only finite CTF points count', () => {
  const solves = [{ points: 3 }, { points: Number.NaN }, { points: '4' }, {}, { points: Number.POSITIVE_INFINITY }];
  assert.equal(points.hackerPoints([], [], solves), 3);
});

test('labels', () => {
  assert.equal(stampbook.pointsLabel(1), '1 point');
  assert.equal(stampbook.pointsLabel(0), '0 points');
  assert.equal(stampbook.pointsLabel(12), '12 points');
  assert.equal(stampbook.raffleEntriesLabel(1), '1 raffle entry');
  assert.equal(stampbook.raffleEntriesLabel(3), '3 raffle entries');
  assert.equal(stampbook.stampValueLabel(1), '1 pt');
  assert.equal(stampbook.stampValueLabel(5), '5 pts');
  assert.equal(stampbook.stampValueLabel(0), undefined);
  assert.equal(stampbook.stampValueLabel(undefined), undefined);
});
