const assert = require('node:assert/strict');
const { test } = require('node:test');
const { load } = require('./load-ts.cjs');

const EVENT = 'HackCamp2026';

// A fresh store over a fake Firestore: `flag` is what a read sees, `listeners` are live.
function setup(flag = false) {
  const firestore = { flag, reads: 0, subscribes: 0, listeners: new Set() };
  firestore.flip = (value) => {
    firestore.flag = value;
    for (const listener of firestore.listeners) listener.onChange(value);
  };
  firestore.fail = (error = new Error('permission-denied')) => {
    for (const listener of [...firestore.listeners]) {
      firestore.listeners.delete(listener);
      listener.onError(error);
    }
  };
  const { useWrappedStore } = load('src/lib/stores/wrapped-store.ts', {
    zustand: require('zustand'),
    '@/services/socials': { fetchWrappedOptIn: async () => true },
    '@/services/wrapped': {
      fetchWrappedDoc: async () => null,
      fetchWrappedReady: async () => {
        firestore.reads++;
        if (firestore.flag instanceof Error) throw firestore.flag;
        return firestore.flag;
      },
      subscribeToWrappedReady: (_event, onChange, onError) => {
        firestore.subscribes++;
        const listener = { onChange, onError };
        firestore.listeners.add(listener);
        return () => firestore.listeners.delete(listener);
      },
    },
  });
  return { firestore, store: useWrappedStore.getState, ready: () => useWrappedStore.getState().ready[EVENT] };
}

// The store logs the failures these tests provoke on purpose.
function silenceConsoleError(t) {
  t.mock.method(console, 'error', () => {});
}

test('an open tab sees the switch turn on, and back off, without a reload', () => {
  const { firestore, store, ready } = setup(false);
  store().watchReady(EVENT);
  firestore.flip(false);
  assert.equal(ready(), false);
  firestore.flip(true);
  assert.equal(ready(), true);
  firestore.flip(false);
  assert.equal(ready(), false);
});

test('while a listener has the flag, direct navigation uses it instead of reading', async () => {
  const { firestore, store } = setup(false);
  store().watchReady(EVENT);
  firestore.flip(false);
  firestore.flip(true);
  assert.equal(await store().getOrFetchReady(EVENT), true);
  assert.equal(firestore.reads, 0);
});

test('with no listener, direct navigation is not stuck on an earlier false', async () => {
  const { firestore, store } = setup(false);
  assert.equal(await store().getOrFetchReady(EVENT), false);
  firestore.flag = true;
  assert.equal(await store().getOrFetchReady(EVENT), true);
  assert.equal(firestore.reads, 2);
});

test('a false left behind by a stopped listener is not trusted either', async () => {
  const { firestore, store } = setup(false);
  const release = store().watchReady(EVENT);
  firestore.flip(false);
  release();
  firestore.flag = true;
  assert.equal(await store().getOrFetchReady(EVENT), true);
});

test('before the listener delivers, navigation reads rather than waiting on it', async () => {
  const { firestore, store } = setup(true);
  store().watchReady(EVENT);
  assert.equal(await store().getOrFetchReady(EVENT), true);
  assert.equal(firestore.reads, 1);
});

test('a listener delivering during a read wins over what the read saw', async () => {
  const { firestore, store, ready } = setup(false);
  store().watchReady(EVENT);
  const read = store().getOrFetchReady(EVENT);
  firestore.flip(true);
  assert.equal(await read, true);
  assert.equal(ready(), true);
});

test('the sidebar and banner share one listener, which stops with the last of them', () => {
  const { firestore, store } = setup(false);
  const sidebar = store().watchReady(EVENT);
  const banner = store().watchReady(EVENT);
  assert.equal(firestore.subscribes, 1);
  sidebar();
  assert.equal(firestore.listeners.size, 1);
  banner();
  assert.equal(firestore.listeners.size, 0);
  store().watchReady(EVENT);
  assert.equal(firestore.subscribes, 2);
});

test('after the listener fails, navigation reads again and the next watch resubscribes', async (t) => {
  silenceConsoleError(t);
  const { firestore, store } = setup(false);
  const staleHold = store().watchReady(EVENT);
  firestore.flip(false);
  firestore.fail();

  firestore.flag = true;
  assert.equal(await store().getOrFetchReady(EVENT), true);
  assert.equal(firestore.reads, 1);

  store().watchReady(EVENT);
  assert.equal(firestore.subscribes, 2);
  // Leaving the dead listener must not take the new one down with it.
  staleHold();
  assert.equal(firestore.listeners.size, 1);
  firestore.flip(false);
  assert.equal(await store().getOrFetchReady(EVENT), false);
  assert.equal(firestore.reads, 1);
});

test('a failed read counts as not released and stores nothing', async (t) => {
  silenceConsoleError(t);
  const { firestore, store, ready } = setup(new Error('unavailable'));
  assert.equal(await store().getOrFetchReady(EVENT), false);
  assert.equal(ready(), undefined);
  firestore.flag = true;
  assert.equal(await store().getOrFetchReady(EVENT), true);
});
