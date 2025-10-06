import { useApplicantStore } from "@/lib/stores/applicant-store";
import { createOrMergeApplicant } from "@/services/applicants";
import { useEffect, useState } from "react";

/**
 * Starts an autosave loop for the local applicant draft, saves when draft is dirty + not submitted
 *
 * @param dbCollectionName - firestore collection name for the active hackathon
 * @param uid - user id; autosave is disabled if undefined
 * @param intervalMs - autosave interval in milliseconds (default: 15s)
 * @returns true while a save is in-flight, otherwise false
 */
export function useApplicantAutosave(
  dbCollectionName: string,
  uid: string | undefined,
  intervalMs = 15_000,
) {
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!uid) return;

    let cancelled = false;

    const interval = setInterval(async () => {
      const state = useApplicantStore.getState();
      const draft = state.applicantDraft;

      if (!draft || !state.dirty || !!draft.submission?.submitted) return;

      try {
        if (!cancelled) {
          setSaving(true); // prevent multiple saves from being triggered in quick succession
        }

        await createOrMergeApplicant(dbCollectionName, uid, draft);

        // only clear dirty if no new edits occurred during the save
        const { applicantDraft: currentDraft } = useApplicantStore.getState();
        useApplicantStore.setState({ dirty: currentDraft !== draft, lastLocalSaveAt: Date.now() });
      } catch {
        console.error("[applicant][autosave] save failed", { _id: draft._id });
      } finally {
        if (!cancelled) {
          setSaving(false);
        }
      }
    }, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [dbCollectionName, uid, intervalMs]);

  return saving;
}
