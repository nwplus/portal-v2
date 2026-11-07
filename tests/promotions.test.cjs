const assert = require('node:assert/strict');
const { test } = require('node:test');
const { load } = require('./load-ts.cjs');

const promotions = load('src/lib/promotions.ts');

const lovable = (overrides = {}) => ({
  id: 'lovable', sponsor: 'Lovable', type: 'discount_code', instructions: 'Paste at checkout',
  redemption_url: 'https://lovable.dev/redeem', available: true, ...overrides,
});
const claimFor = (promotionId, code = 'ABC-123') => ({
  promotionId, codeDocId: 'doc1', sponsor: 'Lovable', type: 'discount_code', code,
  instructions: 'Paste at checkout', redemption_url: 'https://lovable.dev/redeem',
  claimedAt: { _seconds: 1, _nanoseconds: 0 },
});

test('promotionKey prefers the id and falls back to a sponsor slug', () => {
  assert.equal(promotions.promotionKey({ id: 'lovable-2026', sponsor: 'Lovable' }), 'lovable-2026');
  assert.equal(promotions.promotionKey({ sponsor: 'Lovable (Pro plan)!' }), 'lovable-pro-plan');
  assert.equal(promotions.slugify('x'.repeat(80)).length, 64);
});

test('sponsorName uses the sponsor, else a title-cased id, matching the prod entry shape', () => {
  assert.equal(promotions.sponsorName({ id: 'lovable', sponsor: 'Lovable AI' }), 'Lovable AI');
  assert.equal(promotions.sponsorName({ id: 'lovable' }), 'Lovable');
  assert.equal(promotions.sponsorName({ id: 'github-copilot_pro', sponsor: ' ' }), 'Github Copilot Pro');
  const prodEntry = { available: true, id: 'lovable', instructions: 'x', redemption_url: 'https://x', type: 'discount_codes' };
  const [perk] = promotions.getPerks([prodEntry], undefined);
  assert.equal(perk.promotionId, 'lovable');
  assert.equal(promotions.sponsorName(perk.promotion), 'Lovable');
});

test('getPerks hides unavailable perks unless already claimed, and is empty when nothing applies', () => {
  assert.deepEqual(promotions.getPerks(undefined, undefined), []);
  assert.deepEqual(promotions.getPerks([lovable({ available: false })], {}), []);

  const [open] = promotions.getPerks([lovable()], undefined);
  assert.equal(open.promotionId, 'lovable');
  assert.equal(open.claim, undefined);

  const claimed = { lovable: claimFor('lovable') };
  const [held] = promotions.getPerks([lovable({ available: false })], claimed);
  assert.equal(held.claim.code, 'ABC-123');
});

test('getPerks keys sponsor-only entries by slug, skips junk and duplicates', () => {
  const list = [lovable({ id: undefined }), lovable(), null, 'nope'];
  const perks = promotions.getPerks(list, { lovable: claimFor('lovable') });
  assert.equal(perks.length, 1);
  assert.equal(perks[0].promotionId, 'lovable');
  assert.equal(perks[0].claim.code, 'ABC-123');
});

test('a claim whose promotion vanished from the hackathon doc still renders from the claim copy', () => {
  const [perk] = promotions.getPerks([], { vercel: { ...claimFor('vercel', 'V-1'), sponsor: 'Vercel' } });
  assert.equal(perk.promotion.sponsor, 'Vercel');
  assert.equal(perk.promotion.available, false);
  assert.equal(perk.claim.code, 'V-1');
});

test('claim results and callable errors map to copy', () => {
  const claim = claimFor('lovable');
  assert.deepEqual(promotions.describeClaimResult({ status: 'claimed', claim }, 'Lovable'),
    { tone: 'success', message: 'Your Lovable code is ready!' });
  assert.deepEqual(promotions.describeClaimResult({ status: 'alreadyClaimed', claim }, 'Lovable'),
    { tone: 'info', message: 'You already have a Lovable code.' });
  assert.deepEqual(promotions.describeClaimResult({ status: 'soldOut' }, 'Lovable'),
    { tone: 'error', message: 'All Lovable codes have been claimed.' });
  assert.deepEqual(promotions.describeClaimResult({ status: 'unavailable' }, 'Lovable'),
    { tone: 'error', message: "The Lovable perk isn't available right now." });

  assert.equal(promotions.describeClaimError('functions/failed-precondition'), "Perks are available to hackers who've RSVP'd.");
  assert.match(promotions.describeClaimError('functions/unavailable'), /won't get a duplicate/);
  assert.equal(promotions.describeClaimError('functions/aborted'), 'Codes are going fast. Try again.');
  assert.equal(promotions.describeClaimError(undefined), 'Something went wrong. Try again.');
});
