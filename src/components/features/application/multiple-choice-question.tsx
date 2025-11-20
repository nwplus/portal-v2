import type { QuestionFieldProps } from "@/components/features/application/question-field";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useQuestionFieldConfig } from "@/hooks/use-question-field-config";
import type { ApplicationFormValues } from "@/lib/application/types";
import { Controller } from "react-hook-form";
import type { FieldPath } from "react-hook-form";

/**
 * Renders a "Multiple Choice" question.
 *
 * Visually this is a set of checkboxes, but the underlying value is a single
 * string (one selected option or "other"), so we enforce radio-like behavior.
 */
export function MultipleChoiceQuestion(props: QuestionFieldProps) {
  const {
    register,
    control,
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
      <FieldTitle>
        {label}
        {isRequired ? <span className="text-border-danger"> *</span> : null}
      </FieldTitle>
      {description ? <FieldDescription>{description}</FieldDescription> : null}

      <FieldContent>
        <Controller
          name={mainPath as FieldPath<ApplicationFormValues>}
          control={control}
          render={({ field }) => {
            const currentValue = field.value as string | undefined;

            const handleSelect = (value: string) => {
              field.onChange(currentValue === value ? "" : value);
            };

            const shouldShowOtherInput = currentValue === "other" && otherPath;

            return (
              <div className="space-y-1">
                {options.map((optionLabel, index) => {
                  const optionId = `${baseId}-option-${index}`;
                  return (
                    <div key={optionLabel} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        id={optionId}
                        checked={currentValue === optionLabel}
                        onCheckedChange={() => handleSelect(optionLabel)}
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
                        checked={currentValue === "other"}
                        onCheckedChange={() => handleSelect("other")}
                        aria-invalid={isMainInvalid || isOtherInvalid}
                      />
                      <FieldLabel htmlFor={`${baseId}-other`} className="font-normal text-sm">
                        Other (please specify)
                      </FieldLabel>
                    </div>
                    {shouldShowOtherInput ? (
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
