import { NO_SOURCE_PATH, isConditionMet } from "@/lib/application/condition";
import { useApplicationSchemaMeta } from "@/lib/application/schema-meta-context";
import type { ApplicationFormValues } from "@/lib/application/types";
import type { HackerApplicationNonWelcomeQuestion } from "@/lib/firebase/types/hacker-app-questions";
import type { FieldPath } from "react-hook-form";
import { useFormContext, useWatch } from "react-hook-form";

export function useQuestionVisibility(question: HackerApplicationNonWelcomeQuestion): boolean {
  const meta = useApplicationSchemaMeta();
  const { control } = useFormContext<ApplicationFormValues>();

  const condition = question.condition;
  const sourcePath = condition
    ? (meta?.conditionSourcePaths[condition.sourceFormInput] ?? null)
    : null;

  const sourceValue = useWatch({
    control,
    name: (sourcePath ?? NO_SOURCE_PATH) as FieldPath<ApplicationFormValues>,
  });

  if (!condition) return true;

  return Boolean(sourcePath) && isConditionMet(condition, sourceValue);
}
