import { fetchWrappedReady } from "@/services/wrapped";
import { create } from "zustand";

type WrappedStore = {
  /** `Hackathons/{dbCollectionName}.wrapped.isReady`, keyed by dbCollectionName. */
  ready: Record<string, boolean>;
  /**
   * Resolves the release flag, reading Firestore at most once per event per session.
   * A failed read counts as not released but is not cached, so a later call retries.
   */
  getOrFetchReady: (dbCollectionName: string) => Promise<boolean>;
};

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
}));
