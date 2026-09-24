const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise production modules without initializing Firebase or adding a test dependency.
function load(file, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(resolve(file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    require(name) {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    console,
  }, { filename: file });
  return exports;
}

const records = ['nwHacks2025', 'nwHacks2026', 'cmd-f2024'].map((hackathonId) => ({
  uid: 'profile-owner', hackathonId, eventYear: Number(hackathonId.slice(-4)),
  recordedAt: { seconds: 1, nanoseconds: 0 }, sourceVersion: 1,
}));

test('brands deduplicate while full records retain counts, years, and historical cmd-f', () => {
  const { getAttendanceBrands } = load('src/lib/attendance.ts');
  assert.deepEqual([...getAttendanceBrands(records)], ['nwhacks', 'cmd-f']);
  assert.equal(records.length, 3);
  assert.equal(records.filter((record) => record.eventYear === 2026).length, 1);
  assert.deepEqual([...getAttendanceBrands([])], []);
  assert.deepEqual([...getAttendanceBrands([
    { hackathonId: 'HackCamp2026' }, { hackathonId: 'NWHACKS2026' },
    { hackathonId: 'cmdf2023' }, { hackathonId: 'unknown2026' },
  ])], ['hackcamp', 'nwhacks', 'cmd-f']);
});

test('service requires auth, queries the profile owner, and propagates errors', async () => {
  const auth = { currentUser: null };
  let calls = 0;
  let failure;
  let data = records;
  const { fetchAttendance } = load('src/services/attendance.ts', {
    '@/lib/firebase/client': { auth, db: 'db' },
    'firebase/firestore': {
      collection(db, name) { assert.equal(db, 'db'); assert.equal(name, 'Attendance'); return name; },
      where(field, operator, uid) {
        assert.deepEqual([field, operator, uid], ['uid', '==', 'profile-owner']);
        return uid;
      },
      query: (...parts) => parts,
      async getDocs() {
        calls++;
        if (failure) throw failure;
        return { docs: data.map((record) => ({ data: () => record })) };
      },
    },
  });
  await assert.rejects(fetchAttendance('profile-owner'), /Authentication/);
  assert.equal(calls, 0);
  auth.currentUser = { uid: 'different-viewer' };
  assert.equal((await fetchAttendance('profile-owner')).length, 3);
  data = [];
  assert.equal((await fetchAttendance('profile-owner')).length, 0);
  failure = new Error('permission-denied');
  await assert.rejects(fetchAttendance('profile-owner'), /permission-denied/);
});

// Minimal effect scheduler makes request completion order deterministic. This tests
// the hook's state/race logic; it does not replace a real authenticated browser check.
function hookHarness() {
  const auth = { currentUser: null };
  const store = { user: null, loading: true };
  const requests = [];
  let state = null;
  let previousDeps;
  let nextEffect;
  let cleanup;
  const { useAttendance } = load('src/hooks/use-attendance.ts', {
    '@/lib/firebase/client': { auth },
    '@/lib/stores/auth-store': { useAuthStore: (selector) => selector(store) },
    '@/services/attendance': {
      fetchAttendance(uid) {
        return new Promise((resolve, reject) => requests.push({ uid, resolve, reject }));
      },
    },
    react: {
      useState: () => [state, (value) => { state = value; }],
      useEffect(effect, deps) {
        if (!previousDeps || deps.some((value, i) => value !== previousDeps[i])) {
          nextEffect = effect;
          previousDeps = deps;
        }
      },
    },
  });
  return {
    requests, store, auth,
    render: (uid) => useAttendance(uid),
    commit() {
      if (!nextEffect) return;
      cleanup?.();
      cleanup = nextEffect();
      nextEffect = null;
    },
    signIn(uid) { store.user = auth.currentUser = { uid }; store.loading = false; },
  };
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

test('hook distinguishes unknown, empty, success and failure; ignores old profile responses', async () => {
  const h = hookHarness();
  assert.equal(h.render('a').count, null);
  h.commit();
  assert.equal(h.requests.length, 0);
  h.signIn('viewer');
  assert.equal(h.render('a').status, 'loading');
  h.commit();
  h.render('b');
  h.commit();
  h.requests[0].resolve(records);
  await flush();
  assert.equal(h.render('b').status, 'loading');
  h.requests[1].resolve([]);
  await flush();
  assert.equal(h.render('b').status, 'success');
  assert.equal(h.render('b').count, 0);
  assert.equal(h.render('a').records, null); // Before the effect runs.
  h.commit();
  h.requests[2].reject(new Error('offline'));
  await flush();
  assert.equal(h.render('a').status, 'error');
  assert.equal(h.render('a').count, null);
  h.render('c');
  h.commit();
  h.requests[3].resolve(records);
  await flush();
  assert.equal(h.render('c').count, 3);
});

test('auth changes immediately hide records and discard in-flight results', async () => {
  const h = hookHarness();
  h.signIn('viewer');
  h.render('a'); h.commit();
  h.requests[0].resolve(records);
  await flush();
  assert.equal(h.render('a').count, 3);
  h.store.loading = true;
  assert.equal(h.render('a').records, null);
  h.commit();
  h.store.user = h.auth.currentUser = null;
  h.store.loading = false;
  assert.equal(h.render('a').status, 'idle');
  h.commit();
  h.signIn('viewer');
  assert.equal(h.render('a').count, null);
  h.commit();
  h.signIn('other-viewer');
  assert.equal(h.render('a').records, null);
  h.commit();
  h.requests[1].resolve(records);
  await flush();
  assert.equal(h.render('a').status, 'loading');
  h.requests[2].resolve([]);
  await flush();
  assert.equal(h.render('a').count, 0);
});

test('Social fetch/create preserves stored legacy fields without writing or scanning attendance', async () => {
  let existing = { _id: 'owner', email: 'owner@example.com', hackathonsAttended: { nwhacks: true } };
  const writes = [];
  const { fetchOrCreateSocial } = load('src/services/socials.ts', {
    '@/lib/firebase/client': { db: 'db' },
    'firebase/firestore': {
      doc(db, collection, uid) {
        assert.equal(collection, 'Socials');
        assert.equal(uid, 'owner');
        return uid;
      },
      getDoc: async () => ({ exists: () => !!existing, data: () => existing }),
      setDoc: async (ref, payload, options) => {
        assert.equal(options.merge, true);
        assert.equal('hackathonsAttended' in payload, false);
        writes.push(payload);
      },
    },
  });
  await fetchOrCreateSocial('owner', 'owner@example.com');
  assert.equal(writes.length, 0);
  await fetchOrCreateSocial('owner', 'owner@example.com', { basicInfo: { school: 'UBC' } });
  assert.equal(writes[0].school, 'UBC');
  assert.equal(existing.hackathonsAttended.nwhacks, true);
  existing = null;
  const created = await fetchOrCreateSocial('owner', 'owner@example.com', {
    basicInfo: { preferredName: 'Name', school: 'UBC' }, skills: { github: 'handle' },
  });
  assert.equal(created.preferredName, 'Name');
  assert.equal(created.socialLinks.github, 'handle');
  assert.equal('hackathonsAttended' in created, false);
});
