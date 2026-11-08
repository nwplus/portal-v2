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

const applicant = (dayOf) => ({ uid: 'u', basicInfo: { email: 'A@x.com' }, dayOf });

test('only a literal dayOf.checkedIn === true is checked in', () => {
  assert.equal(calc.isCheckedIn(applicant({ checkedIn: true })), true);
  for (const dayOf of [undefined, {}, { checkedIn: false }, { checkedIn: 'true' }, { checkedInTime: 'Sat Mar 07 2026' }]) {
    assert.equal(calc.isCheckedIn(applicant(dayOf)), false, JSON.stringify(dayOf));
  }
});

test("an excluded hacker's email on a Devpost row is not reported as unmatched", () => {
  const rows = [{ submissionUrl: 'p1', title: 'P1', techStack: [], about: '', tryItOutLinks: [], memberEmails: ['in@x.com', 'noshow@x.com'] },
                { submissionUrl: 'p2', title: 'P2', techStack: [], about: '', tryItOutLinks: [], memberEmails: ['noshow@x.com'] }];
  const hackers = [{ uid: 'in', emails: ['in@x.com'], name: 'In' }];
  const match = calc.matchHackersToProjects(hackers, rows, { emailToUid: {}, uidToProject: {} });
  const report = calc.summarizeMatch(match, hackers, rows, ['noshow@x.com']);
  assert.deepEqual(report.unmatchedEmails, []);
  assert.deepEqual(report.orphanRows, []);
});
