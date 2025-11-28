import type {
  HackerApplicationQuestionFormInputField,
  HackerApplicationQuestionType,
  HackerApplicationSections,
} from "@/lib/firebase/types/hacker-app-questions";
import { FIXED_QUESTION_CONFIG } from "./fixed-question-config";

export type ApplicantSectionKey = "basicInfo" | "skills" | "questionnaire";

export type FormFieldPath = `${ApplicantSectionKey}.${string}`;

/**
 * Maps a Firestore section to the corresponding ApplicantDraft section key.
 * Returns null for sections that do not have form fields (e.g., Welcome).
 */
export function sectionToApplicantSection(
  section: Omit<HackerApplicationSections, "Welcome">,
): ApplicantSectionKey | null {
  if (section === "BasicInfo") return "basicInfo";
  if (section === "Skills") return "skills";
  if (section === "Questionnaire") return "questionnaire";
  return null;
}

/**
 * Derives the effective formInput key for a question.
 *
 * For most dynamic questions we trust the Firestore-provided formInput.
 * For fixed questions that always map to a specific ApplicantDraft field,
 * we ignore the stored formInput and hardcode the mapping so validation and
 * form wiring stay robust even if Firestore metadata is missing or misnamed.
 */
export function getEffectiveFormInput(question: {
  type?: HackerApplicationQuestionType;
  formInput?: HackerApplicationQuestionFormInputField;
}): HackerApplicationQuestionFormInputField | undefined {
  const questionType = question.type as HackerApplicationQuestionType;

  const fixedConfig = questionType ? FIXED_QUESTION_CONFIG[questionType] : undefined;

  if (fixedConfig && fixedConfig.kind === "single") {
    return fixedConfig.formInput;
  }

  return question.formInput as HackerApplicationQuestionFormInputField | undefined;
}

/**
 * Builds the react-hook-form path for a given question section + formInput.
 * Example: ("BasicInfo", "email") => "basicInfo.email"
 */
export function buildFieldPath(
  section: Omit<HackerApplicationSections, "Welcome">,
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
  section: Omit<HackerApplicationSections, "Welcome">,
  formInput: HackerApplicationQuestionFormInputField,
): FormFieldPath | null {
  const applicantSection = sectionToApplicantSection(section);
  if (!applicantSection) return null;
  const otherKey = `other${capitalizeFirst(formInput)}`;
  return `${applicantSection}.${otherKey}`;
}
