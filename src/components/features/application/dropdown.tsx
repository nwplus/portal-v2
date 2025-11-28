import type { QuestionFieldProps } from "@/components/features/application/question-field";
import { Dropdown } from "@/components/ui/dropdown";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { useQuestionFieldConfig } from "@/hooks/use-question-field-config";
import type { ApplicationFormValues } from "@/lib/application/types";
import { Controller } from "react-hook-form";
import type { FieldPath } from "react-hook-form";

/**
 * Renders a "Dropdown" question using the shared Dropdown UI component.
 *
 * The underlying value is a single string; we bridge the controlled Dropdown
 * component with RHF via Controller.
 */
export function DropdownQuestion(props: QuestionFieldProps) {
  const {
    control,
    trigger,
    label,
    description,
    isRequired,
    mainPath,
    mainError,
    isMainInvalid,
    question,
    mainId,
  } = useQuestionFieldConfig(props);

  if (!mainPath) return null;

  const options = question.options ?? [];
  const isInvalid = isMainInvalid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel isRequired={isRequired}>{label}</FieldLabel>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldContent>
        <Controller
          name={mainPath as FieldPath<ApplicationFormValues>}
          control={control}
          render={({ field }) => (
            <Dropdown
              items={options}
              value={field.value ?? null}
              onValueChange={(value) => {
                field.onChange(value ?? "");
                void trigger(mainPath as FieldPath<ApplicationFormValues>);
              }}
              name={field.name}
              inputId={mainId}
              invalid={isInvalid}
              onBlur={field.onBlur}
            />
          )}
        />
        <FieldError errors={mainError ? [mainError] : undefined} />
      </FieldContent>
    </Field>
  );
}
