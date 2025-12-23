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

// The loader provides an existing applicant when one exists; this hook normalizes that data or
// creates a fresh draft so the applicant store is ready before the form renders
export function useApplicantHydration(params: Params) {
  const { dbCollectionName, applicant, user } = params;
  const setApplicant = useApplicantStore((s) => s.setApplicant);
  const resetApplicant = useApplicantStore((s) => s.reset);

  useEffect(() => {
    // always reset the store whenever the hackathon context or user changes.
    const uid = user?.uid;

    if (!dbCollectionName || !uid) {
      resetApplicant();
      return;
    }

    // avoid overwriting a recently submitted application with stale loader data
    const currentDraft = useApplicantStore.getState().applicantDraft;
    const currentDbCollection = useApplicantStore.getState().dbCollectionName;
    const isCurrentUserSameHackathon =
      currentDraft?._id === uid && currentDbCollection === dbCollectionName;
    const isCurrentlySubmitted =
      currentDraft?.submission?.submitted === true ||
      currentDraft?.status?.applicationStatus === "applied";
    const loaderShowsNotSubmitted =
      applicant?.submission?.submitted !== true &&
      applicant?.status?.applicationStatus !== "applied";

    if (isCurrentUserSameHackathon && isCurrentlySubmitted && loaderShowsNotSubmitted) {
      return;
    }

    resetApplicant();

    if (applicant) {
      // hydrate with the fetched applicant after normalizing submission defaults.
      const normalizedApplicant: ApplicantDraft = {
        ...applicant,
        submission: {
          ...(applicant.submission ?? {}),
          submitted: applicant.submission?.submitted ?? false,
        },
      };

      setApplicant(normalizedApplicant, dbCollectionName);
      return;
    }

    // guard against late async completions after the context changes.
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

    // create the minimal draft and hydrate once the write completes
    const hydrate = async () => {
      try {
        await createOrMergeApplicant(dbCollectionName, uid, draft);
        if (!cancelled) {
          setApplicant(draft, dbCollectionName);
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
