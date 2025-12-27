import type { Applicant } from "@/lib/firebase/types/applicants";
import { fetchApplicant } from "@/services/applicants";
import { create } from "zustand";

type HackerStore = {
  hacker: Applicant | null;
  dbCollectionName: string | null;
  uid: string | null;
  fetchedAt: number | null;

  setHacker: (hacker: Applicant | null, dbCollectionName: string, uid: string) => void;
  reset: () => void;
  getOrFetch: (dbCollectionName: string, uid: string) => Promise<Applicant | null>;
};

/**
 * Hacker Store - read-only cache for authenticated hacker's applicant data
 * Provides applicant data to pages like rewards, my-ticket, etc. and used for route gating
 * NOTE: this is different from applicant-store, which is used within the application flow and subpages
 */
export const useHackerStore = create<HackerStore>((set, get) => ({
  hacker: null,
  dbCollectionName: null,
  uid: null,
  fetchedAt: null,

  setHacker: (hacker, dbCollectionName, uid) => {
    set({
      hacker,
      dbCollectionName,
      uid,
      fetchedAt: Date.now(),
    });
  },

  reset: () => {
    set({
      hacker: null,
      dbCollectionName: null,
      uid: null,
      fetchedAt: null,
    });
  },

  getOrFetch: async (dbCollectionName, uid) => {
    const state = get();

    if (
      state.fetchedAt !== null &&
      state.dbCollectionName === dbCollectionName &&
      state.uid === uid
    ) {
      return state.hacker;
    }

    const hacker = await fetchApplicant(dbCollectionName, uid);
    set({ hacker, dbCollectionName, uid, fetchedAt: Date.now() });
    return hacker;
  },
}));
