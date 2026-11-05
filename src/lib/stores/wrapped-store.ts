import { fetchWrappedOptIn } from "@/services/socials";
import { fetchWrappedDoc, fetchWrappedReady, subscribeToWrappedReady } from "@/services/wrapped";
import { create } from "zustand";

type WrappedStore = {
  /** `Hackathons/{dbCollectionName}.wrapped.isReady`, keyed by dbCollectionName. */
  ready: Record<string, boolean>;
  /**
   * Keeps `ready` live while anything needs it, so an open tab sees the switch change.
   * The sidebar and banner share one listener.
   *
   * @returns function that gives up this caller's hold on the listener
   */
  watchReady: (dbCollectionName: string) => () => void;
  /**
   * Resolves the release flag: the live value if a listener has one, else a fresh read,
   * since a value left in `ready` may predate the switch changing. A failed read counts
   * as not released and stores nothing.
   */
  getOrFetchReady: (dbCollectionName: string) => Promise<boolean>;
  /**
   * Whether this hacker has a deck to open: their `Wrapped/{uid}` doc exists and they
   * haven't opted out. Keyed by `accessKey`. The deck route checks the same two things.
   */
  access: Record<string, boolean>;
  /** Resolves `access`, reading once per hacker per event per session. */
  getOrFetchAccess: (dbCollectionName: string, uid: string) => Promise<boolean>;
  /** Forgets `access`, so an opt-in change on the profile shows up without a reload. */
  clearAccess: () => void;
};

export const accessKey = (dbCollectionName: string, uid: string) => `${dbCollectionName}/${uid}`;

type ReadyWatch = {
  /** Mounted callers holding the listener open; it stops when the last one leaves. */
  holds: number;
  /** Whether the listener has delivered, making `ready` current for this event. */
  hasValue: boolean;
  unsubscribe: () => void;
};

/** Running release-flag listeners, keyed by dbCollectionName. */
const readyWatches = new Map<string, ReadyWatch>();

/**
 * Access reads in flight, so the sidebar and banner mounting together share one. Each is
 * tagged with the clear it started after: one that lands after a later `clearAccess` read
 * the old opt-in, so it isn't stored.
 */
const accessReads = new Map<string, Promise<boolean>>();
let accessGeneration = 0;

export const useWrappedStore = create<WrappedStore>((set, get) => ({
  ready: {},
  watchReady: (dbCollectionName) => {
    const store = (isReady: boolean) =>
      set((state) => ({ ready: { ...state.ready, [dbCollectionName]: isReady } }));

    let watch = readyWatches.get(dbCollectionName);
    if (!watch) {
      const created: ReadyWatch = { holds: 0, hasValue: false, unsubscribe: () => {} };
      readyWatches.set(dbCollectionName, created);
      created.unsubscribe = subscribeToWrappedReady(
        dbCollectionName,
        (isReady) => {
          created.hasValue = true;
          store(isReady);
        },
        (error) => {
          console.error("Wrapped release flag listener failed", error);
          // The listener is dead, so `ready` is no longer live. The next watch starts over.
          if (readyWatches.get(dbCollectionName) === created) {
            readyWatches.delete(dbCollectionName);
          }
        },
      );
      watch = created;
    }

    const held = watch;
    held.holds++;
    return () => {
      held.holds--;
      if (held.holds > 0) return;
      held.unsubscribe();
      if (readyWatches.get(dbCollectionName) === held) readyWatches.delete(dbCollectionName);
    };
  },
  getOrFetchReady: async (dbCollectionName) => {
    if (readyWatches.get(dbCollectionName)?.hasValue) {
      return get().ready[dbCollectionName] === true;
    }

    let isReady: boolean;
    try {
      isReady = await fetchWrappedReady(dbCollectionName);
    } catch (error) {
      console.error("Failed to read wrapped release flag", error);
      return false;
    }
    // A listener that delivered during the read is newer than what the read saw.
    if (readyWatches.get(dbCollectionName)?.hasValue) {
      return get().ready[dbCollectionName] === true;
    }
    set((state) => ({ ready: { ...state.ready, [dbCollectionName]: isReady } }));
    return isReady;
  },

  access: {},
  getOrFetchAccess: async (dbCollectionName, uid) => {
    const key = accessKey(dbCollectionName, uid);
    const cached = get().access[key];
    if (cached !== undefined) return cached;
    const pending = accessReads.get(key);
    if (pending) return pending;

    const generation = accessGeneration;
    const read = (async () => {
      try {
        // Opted-out hackers get no link even if a deck predating their opt-out is still
        // in Firestore: the deck route refuses them, so the link would 404.
        const [doc, isOptedIn] = await Promise.all([
          fetchWrappedDoc(dbCollectionName, uid),
          fetchWrappedOptIn(uid),
        ]);
        const hasAccess = doc !== null && isOptedIn;
        if (generation === accessGeneration) {
          set((state) => ({ access: { ...state.access, [key]: hasAccess } }));
        }
        return hasAccess;
      } catch (error) {
        console.error("Failed to check for wrapped deck", error);
        return false;
      } finally {
        // A clear since has dropped this read, and a newer one may hold the key.
        if (generation === accessGeneration) accessReads.delete(key);
      }
    })();
    accessReads.set(key, read);
    return read;
  },
  clearAccess: () => {
    accessGeneration++;
    accessReads.clear();
    set({ access: {} });
  },
}));
