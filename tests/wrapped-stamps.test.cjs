const assert = require('node:assert/strict');
const { test } = require('node:test');
const { load } = require('./load-ts.cjs');

const { buildStampSlots, LOCKED_STAMP_FALLBACK } = load('src/lib/wrapped/stamp-slots.ts');
const { buildSlides } = load('src/lib/wrapped/slides.ts');

const live = [
  { id: 'ctf', name: 'CTF: Git', imgURL: 'ctf.png', lockedImgURL: 'ctf-locked.png', category: 'other' },
  { id: 'dw', name: 'Day Workshop', imgURL: 'dw.png', lockedImgURL: 'dw-locked.png', category: 'dayOfWorkshop' },
  { id: 'pb', name: 'bravo', imgURL: 'pb.png', lockedImgURL: 'pb-locked.png', category: 'preHackathonWorkshop' },
  { id: 'act', name: 'Activity', imgURL: 'act.png', category: 'dayOfActivity' },
  { id: 'none', name: 'Aardvark', imgURL: 'none.png', lockedImgURL: 'none-locked.png' },
  { id: 'pa', name: 'Alpha', imgURL: 'pa-new.png', lockedImgURL: 'pa-locked.png', category: 'preHackathonWorkshop' },
  { id: 'h', name: 'Hidden', imgURL: 'h.png', lockedImgURL: 'h-locked.png', category: 'dayOfActivity', isHidden: true },
];

test('every event stamp, by category then name; collected art over the locked art', () => {
  const slots = buildStampSlots([{ id: 'pa', name: 'old name', imgURL: 'pa-old.png' }], live);
  assert.deepEqual(slots, [
    { id: 'pa', name: 'Alpha', lockedImgURL: 'pa-locked.png', imgURL: 'pa-new.png', collected: true },
    { id: 'pb', name: 'bravo', lockedImgURL: 'pb-locked.png', imgURL: null, collected: false },
    { id: 'act', name: 'Activity', lockedImgURL: LOCKED_STAMP_FALLBACK, imgURL: null, collected: false },
    { id: 'dw', name: 'Day Workshop', lockedImgURL: 'dw-locked.png', imgURL: null, collected: false },
    { id: 'none', name: 'Aardvark', lockedImgURL: 'none-locked.png', imgURL: null, collected: false },
    { id: 'ctf', name: 'CTF: Git', lockedImgURL: 'ctf-locked.png', imgURL: null, collected: false },
  ]);
});

test('a hidden stamp shows only once collected', () => {
  const slots = buildStampSlots([{ id: 'h', name: 'Hidden', imgURL: null }], live);
  assert.deepEqual(slots.find((slot) => slot.id === 'h'), {
    id: 'h',
    name: 'Hidden',
    lockedImgURL: 'h-locked.png',
    imgURL: 'h.png',
    collected: true,
  });
});

test('a collected stamp deleted since the run keeps the doc copy, in the last section', () => {
  const gone = { id: 'gone', name: 'Charlie', imgURL: 'c.png' };
  const slots = buildStampSlots([gone], live);
  assert.deepEqual(slots.slice(-3).map((slot) => slot.id), ['none', 'gone', 'ctf']);
  assert.deepEqual(slots.at(-2), { ...gone, lockedImgURL: LOCKED_STAMP_FALLBACK, collected: true });
});

test('unreadable Stamps fall back to the collected stamps on the doc', () => {
  const collected = [
    { id: 'y', name: 'Yankee', imgURL: 'y.png' },
    { id: 'x', name: 'X-ray', imgURL: null },
  ];
  assert.deepEqual(buildStampSlots(collected, null), [
    { id: 'x', name: 'X-ray', lockedImgURL: LOCKED_STAMP_FALLBACK, imgURL: null, collected: true },
    { id: 'y', name: 'Yankee', lockedImgURL: LOCKED_STAMP_FALLBACK, imgURL: 'y.png', collected: true },
  ]);
});

function deck(stampCount, featured = null) {
  return {
    isFirstTimer: false,
    earlySubmission: null,
    project: null,
    prize: null,
    showedUp: { stamps: Array.from({ length: stampCount }, (_, i) => ({ id: `${i}`, name: `${i}`, imgURL: null })) },
    crossHackerComparison: { featured },
  };
}

test('the stamps slide, and a stamps comparison, need a collected stamp', () => {
  assert.ok(buildSlides(deck(1)).includes('stamps'));
  assert.deepEqual(
    buildSlides(deck(2, 'stamps')).slice(-4),
    ['stamps', 'comparison', 'archetype', 'summary'],
  );
  assert.ok(!buildSlides(deck(0)).includes('stamps'));
  assert.ok(!buildSlides(deck(0, 'stamps')).includes('comparison'));
});
