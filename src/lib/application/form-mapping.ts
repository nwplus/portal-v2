import type {
  HackerApplicationQuestionFormInputField,
  HackerApplicationSections,
} from "@/lib/firebase/types/hacker-app-questions";

export type ApplicantSectionKey = "basicInfo" | "skills" | "questionnaire";

export type FormFieldPath = `${ApplicantSectionKey}.${string}`;

/**
 * Maps a Firestore section to the corresponding ApplicantDraft section key.
 * Returns null for sections that do not have form fields (e.g., Welcome).
 */
export function sectionToApplicantSection(
  section: HackerApplicationSections,
): ApplicantSectionKey | null {
  if (section === "BasicInfo") return "basicInfo";
  if (section === "Skills") return "skills";
  if (section === "Questionnaire") return "questionnaire";
  return null;
}

/**
 * Builds the react-hook-form path for a given question section + formInput.
 * Example: ("BasicInfo", "email") => "basicInfo.email"
 */
export function buildFieldPath(
  section: HackerApplicationSections,
  formInput: HackerApplicationQuestionFormInputField,
): FormFieldPath | null {
  const applicantSection = sectionToApplicantSection(section);
  if (!applicantSection) return null;
  return `${applicantSection}.${formInput}`;
}

function capitalizeFirst(value: string): string {
  if (!value.length) return value;
  return value[0].toUpperCase() + value.slice(1);
}

/**
 * Builds the derived "otherX" path for questions with other === true.
 * Example: ("BasicInfo", "gender") => "basicInfo.otherGender"
 */
export function buildOtherFieldPath(
  section: HackerApplicationSections,
  formInput: HackerApplicationQuestionFormInputField,
): FormFieldPath | null {
  const applicantSection = sectionToApplicantSection(section);
  if (!applicantSection) return null;
  const otherKey = `other${capitalizeFirst(formInput)}`;
  return `${applicantSection}.${otherKey}`;
}
