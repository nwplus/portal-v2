import type { QuestionFieldProps } from "@/components/features/application/question-field";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useQuestionFieldConfig } from "@/hooks/use-question-field-config";
import type { ApplicationFormValues } from "@/lib/application/types";
import { normalizeOptionKey } from "@/lib/application/utils";
import { Controller } from "react-hook-form";
import type { FieldPath } from "react-hook-form";

export function SelectAllQuestion(props: QuestionFieldProps) {
  const {
    register,
    control,
    trigger,
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
    otherId,
    question,
  } = useQuestionFieldConfig(props);

  if (!mainPath) return null;

  const options = question.options ?? [];

  return (
    <Field data-invalid={isMainInvalid || isOtherInvalid}>
      <FieldLabel isRequired={isRequired}>{label}</FieldLabel>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldContent>
        <Controller
          name={mainPath as FieldPath<ApplicationFormValues>}
          control={control}
          render={({ field }) => {
            const rawRecord = (field.value ?? {}) as Record<string, boolean>;

            const normalizedRecord: Record<string, boolean> = {};
            for (const optionLabel of options) {
              const key = normalizeOptionKey(optionLabel);
              normalizedRecord[key] = Boolean(rawRecord[key] ?? rawRecord[optionLabel]);
            }
            if (question.other && otherPath) {
              normalizedRecord.other = Boolean(rawRecord.other);
            }

            const rawKeys = Object.keys(rawRecord);
            const normalizedKeys = Object.keys(normalizedRecord);
            const keysDiffer =
              rawKeys.length !== normalizedKeys.length ||
              normalizedKeys.some((key) => rawRecord[key] !== normalizedRecord[key]);

            if (keysDiffer) {
              field.onChange(normalizedRecord);
            }

            const selectedRecord = normalizedRecord;

            const handleToggle = (optionLabel: string, selected: boolean) => {
              const nextValue = {
                ...selectedRecord,
                [optionLabel]: selected,
              };

              field.onChange(nextValue);
              // Ensure validation re-runs for this question on each change so
              // "Select at least one option" clears as soon as a valid choice
              // is made.
              void trigger(mainPath as FieldPath<ApplicationFormValues>);
            };

            return (
              <div className="space-y-1">
                {options.map((optionLabel, index) => {
                  const key = normalizeOptionKey(optionLabel);
                  const optionId = `${baseId}-option-${index}`;
                  return (
                    <div key={optionLabel} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        id={optionId}
                        checked={Boolean(selectedRecord[key])}
                        onCheckedChange={(checked) => handleToggle(key, Boolean(checked))}
                        aria-invalid={isMainInvalid}
                      />
                      <FieldLabel htmlFor={optionId} className="font-normal text-sm">
                        {optionLabel}
                      </FieldLabel>
                    </div>
                  );
                })}

                {question.other && otherPath && (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <Checkbox
                        id={`${baseId}-other`}
                        checked={Boolean(selectedRecord.other)}
                        onCheckedChange={(checked) => handleToggle("other", Boolean(checked))}
                        aria-invalid={isMainInvalid || isOtherInvalid}
                      />
                      <FieldLabel htmlFor={`${baseId}-other`} className="font-normal text-sm">
                        Other (please specify)
                      </FieldLabel>
                    </div>
                    {selectedRecord.other ? (
                      <Input
                        id={otherId}
                        className="mt-1"
                        placeholder="Please specify"
                        aria-invalid={isOtherInvalid}
                        {...register(otherPath as FieldPath<ApplicationFormValues>)}
                      />
                    ) : null}
                  </>
                )}
              </div>
            );
          }}
        />
        <FieldError errors={[mainError, otherError]} />
      </FieldContent>
    </Field>
  );
}
