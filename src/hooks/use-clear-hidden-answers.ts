import { emptyAnswerFor, isAnswerEmpty, isConditionMet } from "@/lib/application/condition";
import type { ConditionMeta } from "@/lib/application/form-schema";
import { getValueAtPath } from "@/lib/application/object-path";
import type { ApplicationFormValues } from "@/lib/application/types";
import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";

export function useClearHiddenAnswers(
  form: UseFormReturn<ApplicationFormValues>,
  conditionMeta: ConditionMeta[],
) {
  const { getValues, setValue, watch } = form;

  useEffect(() => {
    if (!conditionMeta.length) return;

    const clearHidden = (values: unknown) => {
      for (const entry of conditionMeta) {
        const sourceValue = entry.sourcePath ? getValueAtPath(values, entry.sourcePath) : undefined;
        if (entry.sourcePath && isConditionMet(entry.condition, sourceValue)) continue;

        if (!isAnswerEmpty(entry.questionType, getValueAtPath(values, entry.mainPath))) {
          setValue(entry.mainPath, emptyAnswerFor(entry.questionType), { shouldDirty: true });
        }

        if (entry.otherPath && getValueAtPath(values, entry.otherPath)) {
          setValue(entry.otherPath, "", { shouldDirty: true });
        }
      }
    };

    clearHidden(getValues());

    // not useWatch bc the rerenders fight controllers that are mid render
    const subscription = watch((values) => clearHidden(values));
    return () => subscription.unsubscribe();
  }, [conditionMeta, getValues, setValue, watch]);
}
