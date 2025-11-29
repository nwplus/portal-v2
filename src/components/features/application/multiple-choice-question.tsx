import type { QuestionFieldProps } from "@/components/features/application/question-field";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuestionFieldConfig } from "@/hooks/use-question-field-config";
import type { ApplicationFormValues } from "@/lib/application/types";
import { Controller } from "react-hook-form";
import type { FieldPath } from "react-hook-form";

export function MultipleChoiceQuestion(props: QuestionFieldProps) {
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
            const currentValue = field.value as string | undefined;
            const shouldShowOtherInput = currentValue === "other" && otherPath;

            return (
              <RadioGroup
                value={currentValue ?? ""}
                onValueChange={(value) => {
                  field.onChange(value);
                  void trigger(mainPath as FieldPath<ApplicationFormValues>);
                }}
              >
                {options.map((optionLabel, index) => {
                  const optionId = `${baseId}-option-${index}`;
                  return (
                    <div key={optionLabel} className="flex items-center gap-2 text-sm">
                      <RadioGroupItem
                        id={optionId}
                        value={optionLabel}
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
                      <RadioGroupItem
                        id={`${baseId}-other`}
                        value="other"
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
              </RadioGroup>
            );
          }}
        />
        <FieldError errors={[mainError, otherError]} />
      </FieldContent>
    </Field>
  );
}
