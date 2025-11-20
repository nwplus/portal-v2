import { z } from "zod";

import type { ApplicationFormValues } from "@/lib/application/types";
import type {
  HackerApplicationQuestion,
  HackerApplicationQuestionFormInputField,
  HackerApplicationQuestionMap,
  HackerApplicationQuestionType,
  HackerApplicationSections,
} from "@/lib/firebase/types/hacker-app-questions";
import { buildFieldPath, buildOtherFieldPath } from "./form-mapping";
import { getValueAtPath } from "./object-path";

/**
 * Question buckets by section used for schema generation.
 * We ignore Welcome for schema purposes since it has no inputs.
 */
export type QuestionBuckets = Pick<
  HackerApplicationQuestionMap,
  "BasicInfo" | "Skills" | "Questionnaire" | "Welcome"
>;

export type SchemaMeta = {
  /**
   * Collects field paths by section so steps can validate only their fields
   * (e.g., trigger BasicInfo fields on “Next”).
   */
  fieldNamesBySection: {
    BasicInfo: string[];
    Skills: string[];
    Questionnaire: string[];
  };
  /**
   * Tracks questions that support “other” so we can:
   * - show companion fields in the UI
   * - enforce that an “other” text value is provided when selected
   */
  otherMeta: Array<{
    section: HackerApplicationSections;
    questionType: HackerApplicationQuestionType;
    mainPath: string;
    otherPath: string | null;
  }>;
};

/**
 * Builds a Zod schema for a single question based on its type and flags.
 * This is used to populate the object shape for each section of the form.
 */
function buildFieldSchema(question: HackerApplicationQuestion): z.ZodTypeAny {
  const questionType = question.type as HackerApplicationQuestionType | undefined;
  const isRequired = Boolean(question.required);
  const options = question.options ?? [];
  const formInput = question.formInput as HackerApplicationQuestionFormInputField | undefined;

  switch (questionType) {
    case "Short Answer": {
      const base = z.string().trim();
      return isRequired ? base.min(1, "This field is required") : base.optional().or(z.literal(""));
    }

    case "Long Answer": {
      const base = z.string().trim();
      let field = isRequired
        ? base.min(1, "This field is required")
        : base.optional().or(z.literal(""));

      const maxWordsRaw = question.maxWords;
      if (maxWordsRaw) {
        const maxWords = Number.parseInt(maxWordsRaw, 10);
        if (Number.isFinite(maxWords) && maxWords > 0) {
          field = field.refine(
            (value) => {
              if (typeof value !== "string") return true;
              const words = value.trim().split(/\s+/).filter(Boolean);
              return words.length <= maxWords;
            },
            { message: `Must be at most ${maxWords} words` },
          );
        }
      }

      return field;
    }

    case "Select All": {
      // Stored as Record<string, boolean> keyed by option labels (including "other")
      const base = z.record(z.string(), z.boolean());
      return isRequired
        ? base.refine((value) => Object.values(value).some((flag) => Boolean(flag)), {
            message: "Select at least one option",
          })
        : base;
    }

    case "Multiple Choice": {
      const allowedOptions = [...options];
      if (question.other) {
        // We store the string "other" when the user picks the Other option
        allowedOptions.push("other");
      }

      const base = z.string();
      const withOptions =
        allowedOptions.length > 0
          ? base.refine((value) => allowedOptions.includes(value), {
              message: "Invalid selection",
            })
          : base;

      const field: z.ZodTypeAny = isRequired
        ? withOptions.min(1, "This field is required")
        : withOptions.optional().or(z.literal(""));

      return field;
    }

    case "Dropdown": {
      const allowedOptions = options;

      const base = z.string();
      const withOptions =
        allowedOptions.length > 0
          ? base.refine((value) => allowedOptions.includes(value), {
              message: "Invalid selection",
            })
          : base;

      const field: z.ZodTypeAny = isRequired
        ? withOptions.min(1, "This field is required")
        : withOptions.optional().or(z.literal(""));

      return field;
    }

    case "Portfolio": {
      /**
       * Portfolio-style fields are URL-like strings. This helper is used for:
       * - skills.github
       * - skills.linkedin
       * - skills.portfolio
       * - skills.resume
       *
       * The schema builder may override `question.required` per-field (e.g. resume required,
       * other links optional) before delegating here.
       */
      const base = z.string().trim();
      const optionalized = isRequired ? base : base.optional().or(z.literal(""));

      // For non-resume Portfolio fields we only care that, when present, the value looks like a URL.
      // For resume we still store a URL to the uploaded file.
      return optionalized.refine(
        (value) => {
          if (!value) return true;
          if (typeof value !== "string") return false;
          return /^https?:\/\//i.test(value);
        },
        { message: `Enter a valid URL${formInput ? ` for ${formInput}` : ""}` },
      );
    }

    case "Full Legal Name":
    case "School":
    case "Major":
    case "Country": {
      // These are handled via fixed components / separate fields;
      // we return a passthrough to avoid blocking schema generation.
      return z.any();
    }

    default: {
      // Unknown or missing type; allow anything to avoid blocking the form.
      return z.any();
    }
  }
}

/**
 * Builds the full application schema and metadata for per-section validation.
 */
export function buildApplicationSchema(questions: QuestionBuckets): {
  schema: z.ZodType<ApplicationFormValues>;
  meta: SchemaMeta;
} {
  // Shapes for each section; keys are derived from the question formInput.
  const basicInfoShape: Record<string, z.ZodTypeAny> = {};
  const skillsShape: Record<string, z.ZodTypeAny> = {};
  const questionnaireShape: Record<string, z.ZodTypeAny> = {};

  const fieldNamesBySection: SchemaMeta["fieldNamesBySection"] = {
    BasicInfo: [],
    Skills: [],
    Questionnaire: [],
  };

  const otherMeta: SchemaMeta["otherMeta"] = [];

  // Iterate through each section's questions and build per-field schemas.
  const sectionEntries: Array<[HackerApplicationSections, HackerApplicationQuestion[]]> = [
    ["BasicInfo", questions.BasicInfo ?? []],
    ["Skills", questions.Skills ?? []],
    ["Questionnaire", questions.Questionnaire ?? []],
  ];

  for (const [section, sectionQuestions] of sectionEntries) {
    for (const question of sectionQuestions) {
      const questionType = question.type as HackerApplicationQuestionType | undefined;
      if (!questionType) continue;

      /**
       * Special handling: "Portfolio" is a fixed question that represents four skills fields:
       * - skills.github
       * - skills.linkedin
       * - skills.portfolio
       * - skills.resume
       *
       * We map these directly to the underlying ApplicantDraft.skills properties so they can
       * be edited and validated even though there is only a single Portfolio question in
       * Firestore.
       */
      if (questionType === "Portfolio" && section === "Skills") {
        const isGroupRequired = Boolean(question.required);
        const portfolioKeys: HackerApplicationQuestionFormInputField[] = [
          "github",
          "linkedin",
          "portfolio",
          "resume",
        ];

        for (const key of portfolioKeys) {
          const path = buildFieldPath("Skills", key);
          if (!path) continue;

          const [, mainKey] = path.split(".");
          if (!mainKey) continue;

          const perFieldQuestion: HackerApplicationQuestion = {
            ...question,
            formInput: key,
            // Only resume is required; links remain optional even when the group is required.
            required: key === "resume" ? isGroupRequired : false,
          };

          const fieldSchema = buildFieldSchema(perFieldQuestion);

          skillsShape[mainKey] = fieldSchema;
          fieldNamesBySection.Skills.push(path);
        }

        // Portfolio questions do not participate in "other" tracking.
        continue;
      }

      const formInput = question.formInput as HackerApplicationQuestionFormInputField | undefined;
      if (!formInput) continue;

      const mainPath = buildFieldPath(section, formInput);
      if (!mainPath) continue;

      const otherPath =
        question.other && questionType ? buildOtherFieldPath(section, formInput) : null;

      // Track field paths for step-level validation and "other" enforcement
      if (section === "BasicInfo") fieldNamesBySection.BasicInfo.push(mainPath);
      if (section === "Skills") fieldNamesBySection.Skills.push(mainPath);
      if (section === "Questionnaire") fieldNamesBySection.Questionnaire.push(mainPath);

      if (otherPath) {
        if (section === "BasicInfo") fieldNamesBySection.BasicInfo.push(otherPath);
        if (section === "Skills") fieldNamesBySection.Skills.push(otherPath);
        if (section === "Questionnaire") fieldNamesBySection.Questionnaire.push(otherPath);
        otherMeta.push({
          section,
          questionType,
          mainPath,
          otherPath,
        });
      }

      // Derive the object keys within the section (e.g., "gender", "otherGender")
      const [, mainKey] = mainPath.split(".");
      const otherKey = otherPath ? otherPath.split(".")[1] : null;
      const fieldSchema = buildFieldSchema(question);

      // Attach schemas to the appropriate section shape. For "otherX" paths,
      // default to an optional string; the cross-field refinement enforces presence when needed.
      if (section === "BasicInfo") {
        if (mainKey) basicInfoShape[mainKey] = fieldSchema;
        if (otherKey) {
          basicInfoShape[otherKey] = z.string().trim().optional();
        }
      } else if (section === "Skills") {
        if (mainKey) skillsShape[mainKey] = fieldSchema;
        if (otherKey) {
          skillsShape[otherKey] = z.string().trim().optional();
        }
      } else if (section === "Questionnaire") {
        if (mainKey) questionnaireShape[mainKey] = fieldSchema;
        if (otherKey) {
          questionnaireShape[otherKey] = z.string().trim().optional();
        }
      }
    }
  }

  const basicInfoSchema = z.object(basicInfoShape).passthrough();
  const skillsSchema = z.object(skillsShape).passthrough();
  const questionnaireSchema = z.object(questionnaireShape).passthrough();
  const termsSchema = z.object({
    MLHCodeOfConduct: z.boolean().refine((value) => value === true, "Required"),
    MLHEmailSubscription: z.boolean().optional(),
    MLHPrivacyPolicy: z.boolean().refine((value) => value === true, "Required"),
    nwPlusPrivacyPolicy: z.boolean().refine((value) => value === true, "Required"),
    shareWithSponsors: z.boolean().optional(),
    shareWithnwPlus: z.boolean().refine((value) => value === true, "Required"),
  });

  // Assemble the full schema for react-hook-form resolver consumption.
  let schema = z.object({
    basicInfo: basicInfoSchema,
    skills: skillsSchema,
    questionnaire: questionnaireSchema,
    termsAndConditions: termsSchema,
  }) as z.ZodType<ApplicationFormValues>;

  // Cross-field validation: if "Other" is selected/checked, require a non-empty otherX value.
  schema = schema.superRefine((values, context) => {
    for (const { questionType, mainPath, otherPath } of otherMeta) {
      if (!otherPath) continue;

      const mainValue = getValueAtPath<unknown>(values, mainPath);
      const otherValue = getValueAtPath<unknown>(values, otherPath);

      let needsOtherText = false;

      if (questionType === "Select All") {
        const record = (mainValue ?? {}) as Record<string, boolean>;
        needsOtherText = Boolean(record.other);
      } else if (questionType === "Multiple Choice") {
        needsOtherText = typeof mainValue === "string" && mainValue.toLowerCase() === "other";
      }

      if (needsOtherText) {
        const text = typeof otherValue === "string" ? otherValue.trim() : "";
        if (!text) {
          context.addIssue({
            code: "custom",
            message: "Please specify",
            path: otherPath.split("."),
          });
        }
      }
    }
  });

  const meta: SchemaMeta = { fieldNamesBySection, otherMeta };
  return { schema, meta };
}
