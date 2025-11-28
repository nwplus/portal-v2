import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { ApplicationFormValues } from "@/lib/application/types";
import { useApplicantStore } from "@/lib/stores/applicant-store";

/**
 * Subscribes to react-hook-form changes and mirrors them into the applicant draft store.
 * This keeps autosave working while the form is the primary source of truth during editing.
 */
export function useSyncFormWithApplicantDraft(
  // biome-ignore lint/suspicious/noExplicitAny: matches react-hook-form's UseFormReturn generics including unused TContext
  formMethods: UseFormReturn<ApplicationFormValues, any, ApplicationFormValues>,
) {
  const patchApplicant = useApplicantStore((state) => state.patchApplicant);
  const hasInitialDraft = useApplicantStore((state) => state.applicantDraft !== null);

  useEffect(() => {
    if (!hasInitialDraft) return;

    const subscription = formMethods.watch((values) => {
      patchApplicant({
        basicInfo: values.basicInfo,
        skills: values.skills,
        questionnaire: values.questionnaire,
        termsAndConditions: values.termsAndConditions,
      });
    });

    return () => subscription.unsubscribe();
  }, [formMethods, patchApplicant, hasInitialDraft]);
}
