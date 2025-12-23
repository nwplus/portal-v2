import type {
  HackerApplicationQuestionFormInputField,
  HackerApplicationQuestionType,
  HackerApplicationSections,
} from "@/lib/firebase/types/hacker-app-questions";

type FixedSingleFieldConfig = {
  kind: "single";
  section: HackerApplicationSections;
  formInput: HackerApplicationQuestionFormInputField;
};

type FixedFanOutFieldConfig = {
  kind: "fanOut";
  section: HackerApplicationSections;
  fields: Array<{
    formInput: HackerApplicationQuestionFormInputField;
    /**
     * Optional per-field override for the question type used when building
     * the schema. For example, "Full Legal Name" fans out into two
     * "Short Answer" fields.
     */
    typeOverride?: HackerApplicationQuestionType;
    /**
     * When true, the per-field required flag is derived from the parent
     * question's required flag (i.e. the grouped question's requiredness).
     */
    requiredFromGroup?: boolean;
    /**
     * Explicit per-field required override. When set, this value is used
     * instead of either the group or original question's required flag.
     */
    requiredOverride?: boolean;
  }>;
};

export type FixedQuestionConfig = FixedSingleFieldConfig | FixedFanOutFieldConfig;

/**
 * Central registry for fixed questions that map to specific ApplicantDraft
 * fields, or that fan out into multiple fields.
 *
 * This keeps the mapping from Firestore question types → underlying form
 * fields in one place so the schema builder, form wiring, and review logic
 * can stay in sync.
 */
export const FIXED_QUESTION_CONFIG: Partial<
  Record<HackerApplicationQuestionType, FixedQuestionConfig>
> = {
  School: {
    kind: "single",
    section: "BasicInfo",
    formInput: "school",
  },
  Major: {
    kind: "single",
    section: "BasicInfo",
    formInput: "major",
  },
  Country: {
    kind: "single",
    section: "BasicInfo",
    formInput: "countryOfResidence",
  },
  "Full Legal Name": {
    kind: "fanOut",
    section: "BasicInfo",
    fields: [
      {
        formInput: "legalFirstName",
        typeOverride: "Short Answer",
        requiredFromGroup: true,
      },
      {
        formInput: "legalLastName",
        typeOverride: "Short Answer",
        requiredFromGroup: true,
      },
    ],
  },
  Portfolio: {
    kind: "fanOut",
    section: "Skills",
    fields: [
      // These links are always optional, regardless of the grouped question's required flag.
      { formInput: "github", requiredOverride: false },
      { formInput: "linkedin", requiredOverride: false },
      { formInput: "portfolio", requiredOverride: false },
      // Resume is always required.
      { formInput: "resume", requiredOverride: true },
    ],
  },
};
