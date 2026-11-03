const assert = require('node:assert/strict');
const { test } = require('node:test');
const { load } = require('./load-ts.cjs');

const rules = load('src/lib/wrapped/archetype-rules.ts');
const copy = load('src/lib/wrapped/archetype-copy.ts', { '@/lib/wrapped/archetype-rules': rules });
const { buildShareCardData, ordinalSuffix, shareCardFileName, MISSING_STAT } = load(
  'src/lib/wrapped/share-card.ts',
  { '@/lib/wrapped/archetype-copy': copy },
);

const stamp = (id) => ({ id, name: id, imgURL: null });

const doc = {
  event: 'HackCamp 2026',
  archetype: 'THE_NIGHT_OWL',
  project: { title: 'Rubber Duck', githubLineCount: 5000, githubTeamLineCount: 12000 },
  summary: { attendance: 10, stamps: [stamp('a'), stamp('b'), stamp('c')] },
};

test("the hacker's own lines, project, archetype, event count and stamps", () => {
  assert.deepEqual(buildShareCardData(doc), {
    event: 'HackCamp 2026',
    linesShipped: '5,000',
    linesLabel: 'Lines of code shipped',
    projectName: 'Rubber Duck',
    archetype: 'THE_NIGHT_OWL',
    archetypeLabel: 'The Night Owl',
    hackathonNumber: '10',
    hackathonSuffix: 'th',
    stampCount: '3',
    stampsLabel: 'Stamps collected',
  });
});

test('summary.attendance already counts this event, so it is used as is', () => {
  const data = buildShareCardData({ ...doc, summary: { ...doc.summary, attendance: 1 } });
  assert.equal(`${data.hackathonNumber}${data.hackathonSuffix}`, '1st');
});

test('no repo or no project shows a dash, not zero', () => {
  const noRepo = buildShareCardData({ ...doc, project: { ...doc.project, githubLineCount: null } });
  assert.equal(noRepo.linesShipped, MISSING_STAT);

  const noProject = buildShareCardData({ ...doc, project: null });
  assert.equal(noProject.linesShipped, MISSING_STAT);
  assert.equal(noProject.projectName, MISSING_STAT);

  const blankTitle = buildShareCardData({ ...doc, project: { ...doc.project, title: '  ' } });
  assert.equal(blankTitle.projectName, MISSING_STAT);
});

test('zero is a real count, and singular labels read right', () => {
  const data = buildShareCardData({
    ...doc,
    project: { ...doc.project, githubLineCount: 1 },
    summary: { ...doc.summary, stamps: [stamp('a')] },
  });
  assert.equal(data.linesLabel, 'Line of code shipped');
  assert.equal(data.stampsLabel, 'Stamp collected');

  const none = buildShareCardData({
    ...doc,
    project: { ...doc.project, githubLineCount: 0 },
    summary: { ...doc.summary, stamps: [] },
  });
  assert.equal(none.linesShipped, '0');
  assert.equal(none.stampCount, '0');
});

test('an unknown or missing archetype falls back to the default, icon and label alike', () => {
  for (const archetype of ['THE_MYSTERY', undefined, 'toString']) {
    const data = buildShareCardData({ ...doc, archetype });
    assert.equal(data.archetype, copy.DEFAULT_ARCHETYPE);
    assert.equal(data.archetypeLabel, copy.ARCHETYPE_COPY[copy.DEFAULT_ARCHETYPE].label);
  }
});

test('ordinal suffixes, teens included', () => {
  const cases = { 1: 'st', 2: 'nd', 3: 'rd', 4: 'th', 11: 'th', 12: 'th', 13: 'th', 21: 'st', 22: 'nd', 101: 'st', 111: 'th' };
  for (const [n, suffix] of Object.entries(cases)) assert.equal(ordinalSuffix(Number(n)), suffix);
});

test('the file is named after the event', () => {
  assert.equal(shareCardFileName('HackCamp 2026'), 'hackcamp-2026-hacker-wrapped.png');
  assert.equal(shareCardFileName('cmd-f 2027!'), 'cmd-f-2027-hacker-wrapped.png');
  assert.equal(shareCardFileName(''), 'nwplus-hacker-wrapped.png');
});
