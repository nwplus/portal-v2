import { HACKER_APPLICATION_TEMPLATE } from "@/lib/constants";
import { useApplicantStore } from "@/lib/stores/applicant-store";
import { createOrMergeApplicant, fetchApplicant } from "@/services/applicants";
import { useEffect, useRef } from "react";

/**
 * Hydrates the local applicant draft for the given hackathon/user
 * - if user has an existing application: fetches the existing doc
 * - if user does not have an existing application: creates a minimal draft from HACKER_APPLICATION_TEMPLATE
 *
 * @param dbCollectionName - firestore collection name for the active hackathon
 * @param uid - user id
 */
export function useApplicantHydration(dbCollectionName: string, uid: string | undefined) {
  const setApplicant = useApplicantStore((s) => s.setApplicant);
  const reset = useApplicantStore((s) => s.reset);
  const initializedRef = useRef(false); // guard to avoid duplicate fetch/create on re-render

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!uid || initializedRef.current) return;

      try {
        const existingApplicant = await fetchApplicant(dbCollectionName, uid);

        if (cancelled) return;

        if (existingApplicant) {
          const normalizedApplicant = {
            ...existingApplicant,
            submission: {
              submitted: existingApplicant.submission?.submitted ?? false,
              ...(existingApplicant.submission ?? {}),
            },
          } as const;

          setApplicant(normalizedApplicant);
          initializedRef.current = true;
        } else {
          const draft = { ...HACKER_APPLICATION_TEMPLATE, _id: uid };
          await createOrMergeApplicant(dbCollectionName, uid, draft);

          if (!cancelled) {
            setApplicant(draft);
            initializedRef.current = true;
          }
        }
      } catch (error) {
        console.error("Applicant hydration failed", error);
        initializedRef.current = false;
      }
    }

    reset();
    initializedRef.current = false;
    hydrate();

    return () => {
      cancelled = true;
    };
  }, [dbCollectionName, setApplicant, uid, reset]);
}
