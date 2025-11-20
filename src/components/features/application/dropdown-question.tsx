import type { QuestionFieldProps } from "@/components/features/application/question-field";
import { Dropdown } from "@/components/ui/dropdown";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldTitle,
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
  const { control, label, description, isRequired, mainPath, mainError, isMainInvalid, question } =
    useQuestionFieldConfig(props);

  if (!mainPath) return null;

  const options = question.options ?? [];
  const isInvalid = isMainInvalid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldTitle>
        {label}
        {isRequired ? <span className="text-border-danger"> *</span> : null}
      </FieldTitle>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldContent>
        <Controller
          name={mainPath as FieldPath<ApplicationFormValues>}
          control={control}
          render={({ field }) => (
            <Dropdown
              label={label}
              items={options}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value ?? "")}
            />
          )}
        />
        <FieldError errors={mainError ? [mainError] : undefined} />
      </FieldContent>
    </Field>
  );
}
