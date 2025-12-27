import { HACKER_APPLICATION_TEMPLATE } from "@/lib/constants";
import type { ApplicantDraft } from "@/lib/firebase/types/applicants";
import type { DeepPartial } from "@/lib/types";
import { deepMerge } from "@/lib/utils";
import { create } from "zustand";

type ApplicantStore = {
  applicantDraft: ApplicantDraft | null;
  dbCollectionName: string | null; // tracks which hackathon the current draft was hydrated for
  dirty: boolean; // indicates that the applicant draft has unsaved changes
  lastLocalSaveAt?: number;

  setApplicant: (draft: ApplicantDraft, dbCollectionName: string) => void;
  patchApplicant: (partial: DeepPartial<ApplicantDraft>) => void;
  setDirty: (dirty: boolean) => void;
  markSubmitted: () => void;
  setLastLocalSaveAt: (timestamp: number) => void;
  reset: () => void;
};

/**
 * Applicant Store - manages draft state for the hacker application flow
 * Used within the application form and subpages to handle draft editing, dirty state tracking, and hydration
 * NOTE: this is different from hacker-store, which is a read-only cache for fetching existing applicant data
 */
export const useApplicantStore = create<ApplicantStore>((set, get) => ({
  applicantDraft: null,
  dbCollectionName: null,
  dirty: false,
  lastLocalSaveAt: undefined,

  setApplicant: (draft, dbCollectionName) => {
    set({ applicantDraft: draft, dbCollectionName, dirty: false });
  },
  patchApplicant: (partial) => {
    const prev = get().applicantDraft ?? HACKER_APPLICATION_TEMPLATE;
    const next = deepMerge<ApplicantDraft>(prev, partial);
    set({ applicantDraft: next, dirty: true });
  },
  setDirty: (dirty: boolean) => {
    set({ dirty: dirty });
  },
  markSubmitted: () => {
    const prev = get().applicantDraft;
    if (!prev) return;
    const next: ApplicantDraft = deepMerge(prev, { submission: { submitted: true } });
    set({ applicantDraft: next, dirty: true });
  },
  setLastLocalSaveAt: (timestamp) => {
    set({ lastLocalSaveAt: timestamp });
  },
  reset: () => {
    set({ applicantDraft: null, dbCollectionName: null, dirty: false, lastLocalSaveAt: undefined });
  },
}));
