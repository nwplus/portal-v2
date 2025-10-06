import { HACKER_APPLICATION_TEMPLATE } from "@/lib/constants";
import type { DeepPartial } from "@/lib/types";
import { create } from "zustand";
import type { ApplicantDraft } from "../firebase/types/applicants";
import { deepMerge } from "../utils";

type ApplicantStore = {
  applicantDraft: ApplicantDraft | null;
  dirty: boolean; // indicates that the applicant draft has unsaved changes
  lastLocalSaveAt?: number;

  setApplicant: (draft: ApplicantDraft) => void;
  patchApplicant: (partial: DeepPartial<ApplicantDraft>) => void;
  setDirty: () => void;
  markSubmitted: () => void;
  reset: () => void;
};

export const useApplicantStore = create<ApplicantStore>((set, get) => ({
  applicantDraft: null,
  dirty: false,
  lastLocalSaveAt: undefined,

  setApplicant: (draft) => {
    set({ applicantDraft: draft, dirty: false });
  },
  patchApplicant: (partial) => {
    const prev = get().applicantDraft ?? HACKER_APPLICATION_TEMPLATE;
    const next = deepMerge<ApplicantDraft>(prev, partial);
    set({ applicantDraft: next, dirty: true });
  },
  setDirty: () => {
    set({ dirty: true });
  },
  markSubmitted: () => {
    const prev = get().applicantDraft;
    if (!prev) return;
    const next: ApplicantDraft = deepMerge(prev, { submission: { submitted: true } });
    set({ applicantDraft: next, dirty: true });
  },
  reset: () => {
    set({ applicantDraft: null, dirty: false, lastLocalSaveAt: undefined });
  },
}));
