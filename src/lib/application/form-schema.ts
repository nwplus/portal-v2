import { z } from "zod";

import type { ApplicationFormValues } from "@/lib/application/types";
import type {
  HackerApplicationNonWelcomeQuestion,
  HackerApplicationQuestionFormInputField,
  HackerApplicationQuestionMap,
  HackerApplicationQuestionType,
  HackerApplicationSections,
} from "@/lib/firebase/types/hacker-app-questions";
import { FIXED_QUESTION_CONFIG } from "./fixed-question-config";
import { buildFieldPath, buildOtherFieldPath, getEffectiveFormInput } from "./form-mapping";
import { isGithubUrl, isLinkedinUrl, isValidHttpsUrl } from "./utils";

/**
 * Question buckets by section used for schema generation.
 * We ignore Welcome for schema purposes since it has no inputs.
 */
export type QuestionBuckets = Pick<
  HackerApplicationQuestionMap,
  "BasicInfo" | "Skills" | "Questionnaire"
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
function buildFieldSchema(question: HackerApplicationNonWelcomeQuestion): z.ZodTypeAny {
  const questionType = question.type as HackerApplicationQuestionType;
  const isRequired = Boolean(question.required);
  const options = question.options ?? [];
  const formInput = question.formInput as HackerApplicationQuestionFormInputField | undefined;

  switch (questionType) {
    case "Short Answer": {
      if (formInput === "phoneNumber") {
        const phoneRegex = /^(?=(?:.*\d){7,})\+?[\d\s()-]{6,20}$/;
        const base = z
          .string()
          .trim()
          .refine((val) => !val || phoneRegex.test(val), {
            message: "Enter a valid phone number",
          });
        return isRequired
          ? base.refine((val) => val.length > 0, { message: "This field is required" })
          : base.optional().or(z.literal(""));
      }

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
            { error: `Must be at most ${maxWords} words` },
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
            error: "Select at least one option",
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
          ? base.refine(
              (value) => {
                // Let required / length validators handle "no answer" cases so they
                // can surface a clearer "This field is required" message.
                if (!value) return true;
                return allowedOptions.includes(value);
              },
              {
                error: "Invalid selection",
              },
            )
          : base;

      const field: z.ZodTypeAny = isRequired
        ? withOptions.min(1, "This field is required")
        : withOptions.optional().or(z.literal(""));

      return field;
    }

    case "Dropdown": {
      const allowedOptions = options;
      const base = z.string();

      // For required fields, check non-empty first, then validate options
      if (isRequired) {
        return base.min(1, "This field is required").refine(
          (value) => {
            if (allowedOptions.length === 0) return true;
            return allowedOptions.includes(value);
          },
          { error: "Invalid selection" },
        );
      }

      // For optional fields, allow empty values to pass through
      const withOptions =
        allowedOptions.length > 0
          ? base.refine(
              (value) => {
                if (!value) return true;
                return allowedOptions.includes(value);
              },
              { error: "Invalid selection" },
            )
          : base;

      return withOptions.optional().or(z.literal(""));
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
      // Allow empty / undefined inputs at the base level so we can surface
      // clearer custom messages instead of generic "Invalid input" type errors.
      const base = z.string().trim().optional().or(z.literal(""));

      // GitHub URL: optional, normalized by the form layer, must point at a GitHub domain when present.
      if (formInput === "github") {
        const withGithubCheck = base.refine(
          (value) => {
            if (!value) return true;
            if (typeof value !== "string") return false;
            return isGithubUrl(value);
          },
          {
            error: "Enter a valid GitHub URL (e.g., https://github.com/your-username)",
          },
        );

        return withGithubCheck.optional().or(z.literal(""));
      }

      // LinkedIn URL: optional, normalized by the form layer, must point at a LinkedIn domain when present.
      if (formInput === "linkedin") {
        const withLinkedinCheck = base.refine(
          (value) => {
            if (!value) return true;
            if (typeof value !== "string") return false;
            return isLinkedinUrl(value);
          },
          {
            error: "Enter a valid LinkedIn URL (e.g., https://linkedin.com/in/your-profile)",
          },
        );

        return withLinkedinCheck.optional().or(z.literal(""));
      }

      // Portfolio URL: optional, but must be a valid https URL when present.
      if (formInput === "portfolio") {
        const withPortfolioCheck = base.refine(
          (value) => {
            if (!value) return true;
            if (typeof value !== "string") return false;
            return isValidHttpsUrl(value);
          },
          {
            error: "Enter a valid URL for your portfolio",
          },
        );

        return withPortfolioCheck.optional().or(z.literal(""));
      }

      // Resume URL: required, stored as a URL to the uploaded file.
      if (formInput === "resume") {
        return base.superRefine((value, ctx) => {
          const text = typeof value === "string" ? value.trim() : "";

          if (!text) {
            ctx.addIssue({
              code: "custom",
              message: "Please upload your resume",
            });
            return;
          }

          if (!isValidHttpsUrl(text)) {
            ctx.addIssue({
              code: "custom",
              message: "Enter a valid URL for your resume",
            });
          }
        });
      }

      // Fallback: generic https URL validation for any unexpected Portfolio field.
      const withUrlCheck = base.refine(
        (value) => {
          if (!value) return true;
          if (typeof value !== "string") return false;
          return isValidHttpsUrl(value);
        },
        { error: `Enter a valid URL${formInput ? ` for ${formInput}` : ""}` },
      );

      // We do not currently treat any fallback Portfolio fields as required; if a value
      // is provided it must be a valid https URL, otherwise it is allowed to be empty.
      return withUrlCheck;
    }

    case "Full Legal Name": {
      // This is a grouped fixed question that fans out into multiple fields
      // (legalFirstName / legalLastName) handled by a dedicated component, so
      // we return a passthrough here.
      return z.any();
    }

    case "School": {
      // Fixed School question backed by a searchable list; for now we validate
      // it as a plain trimmed string so we can later support custom schools.
      const base = z.string().trim();
      return isRequired ? base.min(1, "This field is required") : base.optional().or(z.literal(""));
    }

    case "Major": {
      /**
       * Fixed Major question backed by a boolean map keyed by ApplicantMajor.
       * When required, at least one entry must be truthy.
       */
      const base = z.record(z.string(), z.boolean());

      return isRequired
        ? base.refine((value) => Object.values(value).some((flag) => Boolean(flag)), {
            error: "This field is required",
          })
        : base;
    }

    case "Country": {
      const base = z.string().trim().min(1, "This field is required");
      return isRequired ? base : base.optional();
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
  const sectionEntries: Array<[HackerApplicationSections, HackerApplicationNonWelcomeQuestion[]]> =
    [
      ["BasicInfo", questions.BasicInfo ?? []],
      ["Skills", questions.Skills ?? []],
      ["Questionnaire", questions.Questionnaire ?? []],
    ];

  for (const [section, sectionQuestions] of sectionEntries) {
    for (const question of sectionQuestions) {
      const questionType = question.type as HackerApplicationQuestionType;
      if (!questionType) continue;

      // Fixed fan-out questions (e.g., Portfolio, Full Legal Name) that map a single
      // Firestore question to multiple underlying ApplicantDraft fields.
      const fixedConfig = FIXED_QUESTION_CONFIG[questionType];
      if (fixedConfig && fixedConfig.kind === "fanOut" && fixedConfig.section === section) {
        const isGroupRequired = Boolean(question.required);

        for (const field of fixedConfig.fields) {
          const path = buildFieldPath(section, field.formInput);
          if (!path) continue;

          const [, mainKey] = path.split(".");
          if (!mainKey) continue;

          const perFieldQuestion: HackerApplicationNonWelcomeQuestion = {
            ...question,
            type: (field.typeOverride ?? questionType) as HackerApplicationQuestionType,
            formInput: field.formInput,
            required:
              field.requiredOverride !== undefined
                ? field.requiredOverride
                : field.requiredFromGroup
                  ? isGroupRequired
                  : question.required,
          };

          const fieldSchema = buildFieldSchema(perFieldQuestion);

          // Avoid clobbering a more specific schema if one was already defined
          // for this key (e.g., via a legacy dynamic question).
          if (section === "BasicInfo") {
            if (!basicInfoShape[mainKey]) {
              basicInfoShape[mainKey] = fieldSchema;
              fieldNamesBySection.BasicInfo.push(path);
            }
          } else if (section === "Skills") {
            if (!skillsShape[mainKey]) {
              skillsShape[mainKey] = fieldSchema;
              fieldNamesBySection.Skills.push(path);
            }
          } else if (section === "Questionnaire") {
            if (!questionnaireShape[mainKey]) {
              questionnaireShape[mainKey] = fieldSchema;
              fieldNamesBySection.Questionnaire.push(path);
            }
          }
        }

        // Fan-out questions do not participate in "other" tracking.
        continue;
      }

      const formInput = getEffectiveFormInput(question) as
        | HackerApplicationQuestionFormInputField
        | undefined;
      if (!formInput) continue;

      const mainPath = buildFieldPath(section, formInput);
      if (!mainPath) continue;

      const otherPath =
        questionType === "Major"
          ? buildOtherFieldPath(section, formInput)
          : question.other && questionType
            ? buildOtherFieldPath(section, formInput)
            : null;

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

  // Helper to build a section schema with "other" field validation
  function buildSectionSchema(shape: Record<string, z.ZodTypeAny>, sectionPrefix: string) {
    return z
      .object(shape)
      .loose()
      .superRefine((values, ctx) => {
        for (const { questionType, mainPath, otherPath } of otherMeta) {
          if (!mainPath.startsWith(sectionPrefix) || !otherPath) continue;

          const mainKey = mainPath.split(".")[1];
          const otherKey = otherPath.split(".")[1];
          if (!mainKey || !otherKey) continue;

          const mainValue = values[mainKey];
          const otherValue = values[otherKey];

          let needsOtherText = false;
          if (questionType === "Select All" || questionType === "Major") {
            const record = (mainValue ?? {}) as Record<string, boolean>;
            needsOtherText = Boolean(record.other);
          } else if (questionType === "Multiple Choice") {
            needsOtherText = typeof mainValue === "string" && mainValue.toLowerCase() === "other";
          }

          if (needsOtherText) {
            const text = typeof otherValue === "string" ? otherValue.trim() : "";
            if (!text) {
              ctx.addIssue({ code: "custom", message: "Please specify", path: [otherKey] });
            }
          }
        }
      });
  }

  const basicInfoSchema = buildSectionSchema(basicInfoShape, "basicInfo.");
  const skillsSchema = buildSectionSchema(skillsShape, "skills.");
  const questionnaireSchema = buildSectionSchema(questionnaireShape, "questionnaire.");

  const termsSchema = z.object({
    MLHCodeOfConduct: z.boolean().refine((value) => value === true, {
      error: "This field is required",
    }),
    MLHEmailSubscription: z.boolean().optional(),
    MLHPrivacyPolicy: z.boolean().refine((value) => value === true, {
      error: "This field is required",
    }),
    nwPlusPrivacyPolicy: z.boolean().refine((value) => value === true, {
      error: "This field is required",
    }),
    shareWithSponsors: z.boolean().optional(),
    shareWithnwPlus: z.boolean().refine((value) => value === true, {
      error: "This field is required",
    }),
  });

  // Assemble the full schema for react-hook-form resolver consumption.
  const schema = z.object({
    basicInfo: basicInfoSchema,
    skills: skillsSchema,
    questionnaire: questionnaireSchema,
    termsAndConditions: termsSchema,
  }) as z.ZodType<ApplicationFormValues>;

  const meta: SchemaMeta = { fieldNamesBySection, otherMeta };
  return { schema, meta };
}
