import type {
  HackerApplicationQuestionCondition,
  HackerApplicationQuestionType,
} from "@/lib/firebase/types/hacker-app-questions";

// useWatch needs some name even when there's nothing to watch
export const NO_SOURCE_PATH = "__noConditionSource__";

export function isConditionMet(
  condition: HackerApplicationQuestionCondition,
  sourceValue: unknown,
): boolean {
  if (!condition.values.length) return false;

  if (typeof sourceValue === "string") {
    return condition.values.includes(sourceValue);
  }

  // select all isn't a source option but older questions might still use it
  if (sourceValue && typeof sourceValue === "object") {
    const selected = sourceValue as Record<string, boolean>;
    return condition.values.some((value) => selected[value]);
  }

  return false;
}

export function isMultiSelectAnswer(questionType: HackerApplicationQuestionType): boolean {
  return questionType === "Select All" || questionType === "Major";
}

export function isAnswerEmpty(
  questionType: HackerApplicationQuestionType,
  value: unknown,
): boolean {
  if (value == null) return true;

  if (typeof value === "string") return value.trim().length === 0;

  if (isMultiSelectAnswer(questionType)) {
    const selected = value as Record<string, boolean>;
    return !Object.values(selected).some(Boolean);
  }

  return false;
}

export function emptyAnswerFor(
  questionType: HackerApplicationQuestionType,
): "" | Record<never, never> {
  return isMultiSelectAnswer(questionType) ? {} : "";
}
