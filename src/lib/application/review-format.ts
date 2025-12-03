import { MAJOR_KEYS, MAJOR_OPTIONS } from "@/lib/data/majors";
import type { ApplicantDraft } from "@/lib/firebase/types/applicants";
import type {
  HackerApplicationNonWelcomeQuestion,
  HackerApplicationSections,
} from "@/lib/firebase/types/hacker-app-questions";
import {
  buildFieldPath,
  buildOtherFieldPath,
  getEffectiveFormInput,
  getValueAtPath,
  normalizeOptionKey,
} from "./utils";

/**
 * Formats an applicant's answer to a question for display on the review page.
 *
 * - Reads values from ApplicantDraft using the same field paths used by the form.
 * - Applies type-specific rules (select-all, multiple choice, dropdown, long/short answer).
 * - Handles "Other (please specify)" by showing the free-text value instead of the literal "Other".
 */
export function formatAnswerForReview(
  section: Omit<HackerApplicationSections, "Welcome">,
  question: HackerApplicationNonWelcomeQuestion,
  applicantDraft: ApplicantDraft | null,
): string {
  if (!applicantDraft) return "Not answered";

  const formInput = getEffectiveFormInput(question);
  if (!formInput) return "Not answered";

  const mainPath = buildFieldPath(section, formInput);
  if (!mainPath) return "Not answered";

  const otherPath = question.other ? buildOtherFieldPath(section, formInput) : null;

  const mainValue = getValueAtPath<unknown>(applicantDraft, mainPath);
  const otherValue = otherPath ? getValueAtPath<unknown>(applicantDraft, otherPath) : undefined;

  switch (question.type) {
    case "Short Answer":
    case "Long Answer": {
      const value = typeof mainValue === "string" ? mainValue.trim() : "";
      return value || "Not answered";
    }

    case "Select All": {
      const record = (mainValue ?? {}) as Record<string, boolean>;
      const options = question.options ?? [];

      const labels = options.filter((label) => record[normalizeOptionKey(label)]);

      // Handle "Other (please specify)" when present
      if (question.other && record.other) {
        const otherText = typeof otherValue === "string" ? otherValue.trim() : "";
        labels.push(otherText);
      }

      return labels.length ? labels.join(", ") : "Not answered";
    }

    case "Multiple Choice": {
      const raw = typeof mainValue === "string" ? mainValue.trim() : "";
      if (!raw) return "Not answered";

      if (raw.toLowerCase() === "other") {
        const otherText = typeof otherValue === "string" ? otherValue.trim() : "";
        return otherText || "Other";
      }

      return raw;
    }

    case "Major": {
      const record = (mainValue ?? {}) as Record<string, boolean>;

      const majorOtherPath = buildOtherFieldPath(section, formInput);
      const otherMajorText = majorOtherPath
        ? (getValueAtPath<string>(applicantDraft, majorOtherPath) ?? "").trim()
        : "";

      const labels = MAJOR_KEYS.filter((key) => record[key]).map((key) =>
        key === "other" && otherMajorText ? otherMajorText : MAJOR_OPTIONS[key],
      );

      return labels.length ? labels.join(", ") : "Not answered";
    }

    case "Dropdown": {
      const raw =
        typeof mainValue === "string"
          ? mainValue.trim()
          : mainValue == null
            ? ""
            : String(mainValue);
      return raw || "Not answered";
    }

    default: {
      const raw =
        typeof mainValue === "string"
          ? mainValue.trim()
          : mainValue == null
            ? ""
            : String(mainValue);
      return raw || "Not answered";
    }
  }
}
