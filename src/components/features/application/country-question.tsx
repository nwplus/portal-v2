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
import countries from "@/lib/data/countries.json";
import { Controller, useFormContext } from "react-hook-form";
import type { FieldPath } from "react-hook-form";

const COUNTRY_OPTIONS = countries as string[];

export function CountryQuestion({ question }: QuestionFieldProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext<ApplicationFormValues>();

  const label = question.title;
  const description = question.description;
  const isRequired = Boolean(question.required);

  const countryPath = "basicInfo.countryOfResidence" as FieldPath<ApplicationFormValues>;
  const countryError = errors.basicInfo?.countryOfResidence as
    | {
        message?: string;
      }
    | undefined;
  const isInvalid = Boolean(countryError);

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel>
        {label}
        {isRequired ? <span className="text-border-danger"> *</span> : null}
      </FieldLabel>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldContent>
        <Controller
          name={countryPath}
          control={control}
          render={({ field }) => (
            <Dropdown
              items={COUNTRY_OPTIONS}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value ?? "")}
              createOtherOption
              name={field.name}
              invalid={isInvalid}
              onBlur={field.onBlur}
            />
          )}
        />
        <FieldError errors={countryError ? [countryError] : undefined} />
      </FieldContent>
    </Field>
  );
}
