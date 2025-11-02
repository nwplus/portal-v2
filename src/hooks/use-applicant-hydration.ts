import { useEffect } from "react";

import { HACKER_APPLICATION_TEMPLATE } from "@/lib/constants";
import type { Applicant, ApplicantDraft } from "@/lib/firebase/types/applicants";
import { useApplicantStore } from "@/lib/stores/applicant-store";
import { createOrMergeApplicant } from "@/services/applicants";

import type { User } from "firebase/auth";

interface Params {
  dbCollectionName: string | undefined;
  applicant: Applicant | null;
  user: User | null;
}

export function useApplicantHydration(params: Params) {
  const { dbCollectionName, applicant, user } = params;
  const setApplicant = useApplicantStore((s) => s.setApplicant);
  const resetApplicant = useApplicantStore((s) => s.reset);

  useEffect(() => {
    const uid = user?.uid;

    if (!dbCollectionName || !uid) {
      resetApplicant();
      return;
    }

    resetApplicant();

    if (applicant) {
      const normalizedApplicant: ApplicantDraft = {
        ...applicant,
        submission: {
          submitted: applicant.submission?.submitted ?? false,
          ...(applicant.submission ?? {}),
        },
      };

      setApplicant(normalizedApplicant);
      return;
    }

    let cancelled = false;

    const nameParts = (user?.displayName ?? "").trim().split(/\s+/).filter(Boolean);
    const draft: ApplicantDraft = {
      ...HACKER_APPLICATION_TEMPLATE,
      _id: uid,
      basicInfo: {
        legalFirstName: nameParts[0] ?? "",
        legalLastName: nameParts.slice(1).join(" ") ?? "",
        email: user?.email ?? "",
      },
    };

    const hydrate = async () => {
      try {
        await createOrMergeApplicant(dbCollectionName, uid, draft);
        if (!cancelled) {
          setApplicant(draft);
        }
      } catch (error) {
        console.error("Applicant hydration failed", error);
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [dbCollectionName, applicant, resetApplicant, setApplicant, user]);
}
