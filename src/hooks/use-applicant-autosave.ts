import { useApplicantStore } from "@/lib/stores/applicant-store";
import { createOrMergeApplicant } from "@/services/applicants";
import { useEffect, useState } from "react";

const AUTOSAVE_INTERVAL = 15_000;

/**
 * Self-scheduling autosave for the local applicant draft
 * - runs immediately on mount, then schedules the next run after each completes
 * - saves only when the draft is dirty and not submitted
 *
 * @param dbCollectionName - firestore collection name for the active hackathon
 * @param uid - user id
 * @returns true while a save is in-flight, otherwise false
 */
export function useApplicantAutosave(dbCollectionName: string, uid: string | undefined) {
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!uid) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      if (cancelled) return;
      timer = setTimeout(() => void tick(), AUTOSAVE_INTERVAL);
    };

    const tick = async () => {
      if (cancelled) return;
      const { applicantDraft, dirty, setDirty, setLastLocalSaveAt } = useApplicantStore.getState();

      // skip when no changes to save or already submitted, check again later
      if (!dirty || !applicantDraft || !!applicantDraft.submission?.submitted) {
        schedule();
        return;
      }

      try {
        setSaving(true);
        await createOrMergeApplicant(dbCollectionName, uid, applicantDraft);

        // only clear dirty if no new edits occurred during the save
        const { applicantDraft: currentDraft } = useApplicantStore.getState();
        setDirty(currentDraft !== applicantDraft);
        setLastLocalSaveAt(Date.now());
      } catch (error) {
        console.error("[applicant][autosave] save failed", {
          _id: applicantDraft?._id,
          error: error,
        });
      } finally {
        if (!cancelled) setSaving(false);
        schedule();
      }
    };

    void tick();

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [dbCollectionName, uid]);

  return saving;
}
