import { fetchWrappedOptIn } from "@/services/socials";
import { fetchWrappedDoc, fetchWrappedReady } from "@/services/wrapped";
import { create } from "zustand";

type WrappedStore = {
  /** `Hackathons/{dbCollectionName}.wrapped.isReady`, keyed by dbCollectionName. */
  ready: Record<string, boolean>;
  /**
   * Resolves the release flag, reading Firestore at most once per event per session.
   * A failed read counts as not released but is not cached, so a later call retries.
   */
  getOrFetchReady: (dbCollectionName: string) => Promise<boolean>;
  /**
   * Whether this hacker has a deck to open: their `Wrapped/{uid}` doc exists and they
   * haven't opted out. Keyed by `accessKey`. The deck route checks the same two things.
   */
  access: Record<string, boolean>;
  /** Resolves `access`, cached like `ready`: once per hacker per event per session. */
  getOrFetchAccess: (dbCollectionName: string, uid: string) => Promise<boolean>;
  /** Forgets `access`, so an opt-in change on the profile shows up without a reload. */
  clearAccess: () => void;
};

export const accessKey = (dbCollectionName: string, uid: string) => `${dbCollectionName}/${uid}`;

/**
 * Access reads in flight, so the sidebar and banner mounting together share one. Each is
 * tagged with the clear it started after: one that lands after a later `clearAccess` read
 * the old opt-in, so it isn't stored.
 */
const accessReads = new Map<string, Promise<boolean>>();
let accessGeneration = 0;

export const useWrappedStore = create<WrappedStore>((set, get) => ({
  ready: {},
  getOrFetchReady: async (dbCollectionName) => {
    const cached = get().ready[dbCollectionName];
    if (cached !== undefined) return cached;

    let isReady: boolean;
    try {
      isReady = await fetchWrappedReady(dbCollectionName);
    } catch (error) {
      console.error("Failed to read wrapped release flag", error);
      return false;
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
