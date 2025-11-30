import {
  buildFieldPath,
  buildOtherFieldPath,
  getEffectiveFormInput,
} from "@/lib/application/form-mapping";
import { getValueAtPath } from "@/lib/application/object-path";
import type { ApplicationFormValues } from "@/lib/application/types";
import type {
  HackerApplicationNonWelcomeQuestion,
  HackerApplicationSections,
} from "@/lib/firebase/types/hacker-app-questions";
import { useFormContext } from "react-hook-form";
import type { FieldPath } from "react-hook-form";

export interface QuestionFieldConfigInput {
  section: HackerApplicationSections;
  question: HackerApplicationNonWelcomeQuestion;
}

export interface QuestionFieldConfig {
  /**
   * React Hook Form helpers for the shared ApplicationFormValues form.
   *
   * Exposed so per-type components can call register/Controller/watch without
   * having to call useFormContext themselves.
   */
  register: ReturnType<typeof useFormContext<ApplicationFormValues>>["register"];
  control: ReturnType<typeof useFormContext<ApplicationFormValues>>["control"];
  watch: ReturnType<typeof useFormContext<ApplicationFormValues>>["watch"];
  formState: ReturnType<typeof useFormContext<ApplicationFormValues>>["formState"];
  trigger: ReturnType<typeof useFormContext<ApplicationFormValues>>["trigger"];
  setValue: ReturnType<typeof useFormContext<ApplicationFormValues>>["setValue"];

  section: HackerApplicationSections;
  question: HackerApplicationNonWelcomeQuestion;

  /**
   * Human-facing metadata from Firestore.
   */
  label: string;
  description: string | null | undefined;
  isRequired: boolean;

  /**
   * Dynamic React Hook Form field paths derived from Firestore metadata.
   *
   * mainPath points at the primary answer field for the question (e.g. "basicInfo.email").
   * otherPath points at the companion "other" field when question.other === true
   * (e.g. "basicInfo.otherGender").
   */
  mainPath: FieldPath<ApplicationFormValues> | null;
  otherPath: FieldPath<ApplicationFormValues> | null;

  /**
   * Zod/RHF error objects mapped back from formState.errors via the same paths.
   */
  mainError: { message?: string } | undefined;
  otherError: { message?: string } | undefined;
  isMainInvalid: boolean;
  isOtherInvalid: boolean;

  /**
   * Stable DOM ids derived from section + formInput.
   *
   * baseId is a shared prefix for all controls in the question.
   * mainId is used to associate the primary label with the main input.
   * otherId is used for "Other (please specify)" text inputs.
   */
  baseId: string;
  mainId: string | undefined;
  otherId: string | undefined;
}

/**
 * useQuestionFieldConfig centralizes the mapping from Firestore question metadata
 * → React Hook Form wiring for the application form.
 *
 * Given a (section, question), it:
 * - Builds strongly-typed RHF paths (mainPath / otherPath) that stay in sync
 *   with ApplicationFormValues and the Zod schema.
 * - Looks up validation errors from formState.errors using the same paths.
 * - Derives stable DOM ids so labels and inputs are correctly associated.
 *
 * Per-type question components can call this hook to get all the dynamic
 * plumbing in one place, and focus purely on rendering their UI.
 */
export function useQuestionFieldConfig({
  section,
  question,
}: QuestionFieldConfigInput): QuestionFieldConfig {
  // Grab the shared ApplicationFormValues form instance from context.
  // All application steps share this single RHF form.
  const form = useFormContext<ApplicationFormValues>();
  const { register, control, watch, formState, trigger, setValue } = form;

  // Raw Firestore-driven metadata for this question.
  // formInput is the key we use to derive ApplicationFormValues paths. For fixed
  // questions like School/Major we hardcode the mapping so it stays stable even
  // if Firestore metadata is missing or misnamed.
  const formInput = getEffectiveFormInput(question);
  const label = question.title ?? "Untitled";

  // Build the primary RHF field path for this question.
  // Example: section "BasicInfo", formInput "email" → "basicInfo.email".
  const mainPath = formInput
    ? (buildFieldPath(section, formInput) as FieldPath<ApplicationFormValues>)
    : null;

  // If the question supports an "Other" option, build the companion field path
  // using the same convention as the Zod schema.
  // Example: "basicInfo.gender" → "basicInfo.otherGender".
  const otherPath =
    formInput && question.other
      ? ((buildOtherFieldPath(section, formInput) as FieldPath<ApplicationFormValues>) ?? null)
      : null;

  // Look up validation errors for the main field using the dynamic path.
  // formState.errors mirrors the shape of ApplicationFormValues; getValueAtPath
  // lets us index into it using the string path.
  const mainError =
    mainPath && formState.errors
      ? (getValueAtPath(formState.errors, mainPath) as { message?: string } | undefined)
      : undefined;

  // Same as above, but for the optional "other" field.
  const otherError =
    otherPath && formState.errors
      ? (getValueAtPath(formState.errors, otherPath) as { message?: string } | undefined)
      : undefined;

  const isMainInvalid = Boolean(mainError);
  const isOtherInvalid = Boolean(otherError);

  const description = question.description;
  const isRequired = Boolean(question.required);

  // Stable DOM ids for labels / inputs / checkboxes.
  // baseId ties the whole question together; the specific ids are derived from it.
  const baseId = formInput != null ? `${section}-${formInput}` : `question-${String(question._id)}`;
  const mainId = mainPath ? `${baseId}-input` : undefined;
  const otherId = otherPath ? `${baseId}-other` : undefined;

  return {
    register,
    control,
    watch,
    formState,
    trigger,
    setValue,
    section,
    question,
    label,
    description,
    isRequired,
    mainPath,
    otherPath,
    mainError,
    otherError,
    isMainInvalid,
    isOtherInvalid,
    baseId,
    mainId,
    otherId,
  };
}
