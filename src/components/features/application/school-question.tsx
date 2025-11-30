import type { QuestionFieldProps } from "@/components/features/application/question-field";
import { Dropdown } from "@/components/ui/dropdown";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import type { ApplicationFormValues } from "@/lib/application/types";
import schools from "@/lib/data/schools.json";
import { Controller, useFormContext } from "react-hook-form";

const SCHOOL_OPTIONS = schools as string[];

export function SchoolQuestion({ question }: QuestionFieldProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext<ApplicationFormValues>();

  const label = question.title;
  const description = question.description;
  const isRequired = Boolean(question.required);

  const schoolPath = "basicInfo.school";
  const schoolError = errors.basicInfo?.school as { message?: string } | undefined;
  const isInvalid = Boolean(schoolError);

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel isRequired={isRequired}>{label}</FieldLabel>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldContent>
        <Controller
          name={schoolPath}
          control={control}
          render={({ field }) => (
            <Dropdown
              items={SCHOOL_OPTIONS}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value ?? "")}
              createOtherOption
              name={field.name}
              invalid={isInvalid}
              onBlur={field.onBlur}
            />
          )}
        />
        <FieldError errors={schoolError ? [schoolError] : undefined} />
      </FieldContent>
    </Field>
  );
}
