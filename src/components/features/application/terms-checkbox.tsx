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

/**
 * Terms and conditions checkbox used on the application review page.
 * - Binds a single boolean field in termsAndConditions via Controller.
 * - Shows a required "*" marker when optional is false.
 * - Renders validation errors using the shared FieldError component.
 */
export function TermsCheckbox({ name, label, optional }: TermsCheckboxProps) {
  const { control, formState } = useFormContext<ApplicationFormValues>();
  const error = getValueAtPath(formState.errors, name) as { message?: string } | undefined;
  const isInvalid = Boolean(error);

  return (
    <Field data-invalid={isInvalid} orientation="horizontal">
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <>
            <Checkbox
              id={name}
              checked={Boolean(field.value)}
              onCheckedChange={(checked) => field.onChange(Boolean(checked))}
              aria-invalid={isInvalid}
            />
            <FieldLabel htmlFor={name} className="cursor-pointer font-normal">
              {label}
              {!optional ? <span className="text-border-danger"> *</span> : null}
            </FieldLabel>
          </>
        )}
      />
      <FieldError errors={error ? [error] : undefined} />
    </Field>
  );
}
