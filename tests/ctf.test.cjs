const assert = require('node:assert/strict');
const { test } = require('node:test');
const { load } = require('./load-ts.cjs');

const ctf = load('src/lib/ctf.ts');

const challenge = (overrides = {}) => ({
  _id: 'day1', order: 1, isOpen: true, title: 'Night one', stampId: 'stamp-day1',
  pointsTable: [10, 7, 5, 3, 2], defaultPoints: 1, totalFlags: 30, claimedCount: 4, ...overrides,
});

test('card state covers coming soon, open, sold out, closed and solved', () => {
  assert.equal(ctf.getChallengeCardState(challenge({ isOpen: false, title: undefined }), false), 'comingSoon');
  assert.equal(ctf.getChallengeCardState(challenge(), false), 'open');
  assert.equal(ctf.getChallengeCardState(challenge({ claimedCount: 30 }), false), 'soldOut');
  assert.equal(ctf.getChallengeCardState(challenge({ isOpen: false }), false), 'closed');
  assert.equal(ctf.getChallengeCardState(challenge({ isOpen: false, title: undefined }), true), 'solved');
  assert.equal(ctf.getChallengeCardState(challenge({ claimedCount: 30 }), true), 'solved');
});

test('card status line', () => {
  assert.equal(ctf.describeCardStatus('open', challenge()), '4/30 claimed');
  assert.equal(ctf.describeCardStatus('soldOut', challenge()), 'All flags claimed');
  assert.equal(ctf.describeCardStatus('closed', challenge()), 'Closed');
  assert.equal(ctf.describeCardStatus('comingSoon', challenge()), 'Coming soon');
  assert.equal(ctf.describeCardStatus('solved', challenge(), { rank: 2, points: 7 }), 'Rank #2 · +7 points');
  assert.equal(ctf.describeCardStatus('solved', challenge(), { rank: 9, points: 1 }), 'Rank #9 · +1 point');
});

test('submit results map to the spec copy', () => {
  const titles = { day1: 'Night one' };
  assert.deepEqual(
    ctf.describeSubmitResult({ status: 'solved', challengeId: 'day1', rank: 1, points: 10, stampName: 'S' }, titles),
    { tone: 'success', message: 'Rank #1 on Night one — +10 points. Stamp unlocked!' },
  );
  assert.deepEqual(
    ctf.describeSubmitResult({ status: 'solved', challengeId: 'dayX', rank: 7, points: 1, stampName: 'S' }, titles),
    { tone: 'success', message: 'Rank #7 on this challenge — +1 point. Stamp unlocked!' },
  );
  assert.deepEqual(
    ctf.describeSubmitResult({ status: 'alreadySolved', challengeId: 'day1', rank: 3, points: 5 }, titles),
    { tone: 'info', message: "You've already solved Night one (rank #3)." },
  );
  assert.deepEqual(ctf.describeSubmitResult({ status: 'invalid' }, titles), { tone: 'error', message: "That's not a valid flag." });
  assert.deepEqual(ctf.describeSubmitResult({ status: 'claimed' }, titles), {
    tone: 'error', message: 'That flag has already been redeemed. Each flag works once.',
  });
  assert.deepEqual(ctf.describeSubmitResult({ status: 'closed' }, titles), {
    tone: 'error', message: "That challenge isn't open right now.",
  });
});

test('callable error codes map to the spec copy, with or without the functions/ prefix', () => {
  assert.equal(ctf.describeSubmitError('functions/resource-exhausted'), 'Too many wrong attempts. Try again in a few minutes.');
  assert.equal(ctf.describeSubmitError('resource-exhausted'), 'Too many wrong attempts. Try again in a few minutes.');
  assert.equal(ctf.describeSubmitError('functions/failed-precondition'), "The CTF is open to hackers who've RSVP'd.");
  assert.equal(ctf.describeSubmitError('functions/internal'), 'Something went wrong. Try again.');
  assert.equal(ctf.describeSubmitError(undefined), 'Something went wrong. Try again.');
});

test('solve summary and challenge sorting', () => {
  assert.deepEqual(ctf.summarizeSolves([{ points: 10 }, { points: 1 }]), { points: 11, solved: 2 });
  assert.deepEqual(ctf.summarizeSolves([]), { points: 0, solved: 0 });
  const unsorted = [challenge({ _id: 'b', order: 2 }), challenge({ _id: 'a', order: 1 })];
  assert.deepEqual(ctf.sortChallenges(unsorted).map((c) => c._id), ['a', 'b']);
  assert.deepEqual(unsorted.map((c) => c._id), ['b', 'a']);
});

test('unlockStampById only unlocks QR-unlockable stamps', async () => {
  const writes = [];
  const stamps = [
    { id: 'qr', data: { name: 'Sponsor booth', isQRUnlockable: true } },
    { id: 'ctf', data: { name: 'CTF day 1', isQRUnlockable: false } },
    { id: 'legacy', data: { name: 'Old stamp' } },
  ];
  const { unlockStampById } = load('src/services/stampbook.ts', {
    '@/lib/firebase/client': { db: 'db' },
    '@/lib/stamps': load('src/lib/stamps.ts'),
    '@/services/applicants': { fetchApplicant: async () => null },
    'firebase/firestore': {
      arrayUnion: (...ids) => ({ arrayUnion: ids }),
      collection: () => 'Stamps',
      doc: (_db, ...path) => path.join('/'),
      getDoc: async () => ({ exists: () => false }),
      getDocs: async () => ({ docs: stamps.map((s) => ({ id: s.id, data: () => s.data })) }),
      setDoc: async (ref, data) => { writes.push({ ref, data }); },
    },
  });

  assert.deepEqual(await unlockStampById('alice', 'ctf', 'hackcamp2026'), { success: false });
  assert.deepEqual(await unlockStampById('alice', 'legacy', 'hackcamp2026'), { success: false });
  assert.deepEqual(await unlockStampById('alice', 'missing', 'hackcamp2026'), { success: false });
  assert.equal(writes.length, 0);

  assert.deepEqual(await unlockStampById('alice', 'qr', 'hackcamp2026'), { success: true, stampName: 'Sponsor booth' });
  assert.equal(writes.length, 1);
  assert.equal(writes[0].ref, 'Socials/alice');
});

test('ctf service maps doc ids, filters solves by uid and returns callable data', async () => {
  const calls = { callable: [], where: [] };
  const snapshots = {
    CtfChallenges: [{ id: 'day1', data: () => ({ order: 1, isOpen: true }) }],
    CtfSolves: [{ id: 'alice_day1', data: () => ({ uid: 'alice', challengeId: 'day1', rank: 1, points: 10 }) }],
  };
  const service = load('src/services/ctf.ts', {
    '@/lib/firebase/client': { db: 'db', functions: 'functions' },
    'firebase/firestore': {
      collection: (_db, ...path) => path[path.length - 1],
      where: (...args) => { calls.where.push(args); return 'where'; },
      query: (ref) => ref,
      onSnapshot: (ref, next) => { next({ docs: snapshots[ref] }); return () => 'unsubscribed'; },
    },
    'firebase/functions': {
      httpsCallable: (functions, name) => {
        assert.equal(functions, 'functions');
        assert.equal(name, 'submitCtfFlag');
        return async (input) => { calls.callable.push(input); return { data: { status: 'invalid' } }; };
      },
    },
  });

  let challenges;
  const unsubscribe = service.subscribeToCtfChallenges('hackcamp2026', (value) => { challenges = value; });
  assert.deepEqual(challenges, [{ _id: 'day1', order: 1, isOpen: true }]);
  assert.equal(unsubscribe(), 'unsubscribed');

  let solves;
  service.subscribeToOwnCtfSolves('hackcamp2026', 'alice', (value) => { solves = value; });
  assert.deepEqual(calls.where, [['uid', '==', 'alice']]);
  assert.equal(solves[0]._id, 'alice_day1');

  assert.deepEqual(await service.submitCtfFlag('hackcamp2026', 'hc26{x}'), { status: 'invalid' });
  assert.deepEqual(calls.callable, [{ dbCollectionName: 'hackcamp2026', flag: 'hc26{x}' }]);
});
