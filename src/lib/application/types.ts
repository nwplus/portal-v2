import type { ApplicantDraft } from "@/lib/firebase/types/applicants";

/**
 * Shape of values managed by react-hook-form for the application.
 * Mirrors the editable sections of ApplicantDraft so we can sync
 * directly with the applicant store and autosave.
 */
export type ApplicationFormValues = {
  basicInfo: ApplicantDraft["basicInfo"];
  skills: ApplicantDraft["skills"];
  questionnaire: ApplicantDraft["questionnaire"];
  termsAndConditions: ApplicantDraft["termsAndConditions"];
};
