import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { getValueAtPath } from "@/lib/application/object-path";
import type { ApplicationFormValues } from "@/lib/application/types";
import { Controller, useFormContext } from "react-hook-form";
import type { FieldPath } from "react-hook-form";

interface TermsCheckboxProps {
  name: FieldPath<ApplicationFormValues>;
  label: string;
  optional?: boolean;
}

export function TermsCheckbox({ name, label, optional }: TermsCheckboxProps) {
  const { control, formState } = useFormContext<ApplicationFormValues>();
  const error = getValueAtPath(formState.errors, name) as { message?: string } | undefined;
  const isInvalid = Boolean(error);

  return (
    <Field data-invalid={isInvalid} orientation="horizontal">
      <div className="flex flex-col gap-2">
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <div className="flex gap-2">
              <Checkbox
                id={name}
                checked={Boolean(field.value)}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                aria-invalid={isInvalid}
              />
              <FieldLabel htmlFor={name} isRequired={!optional}>
                {label}
              </FieldLabel>
            </div>
          )}
        />
        <FieldError errors={error ? [error] : undefined} />
      </div>
    </Field>
  );
}
