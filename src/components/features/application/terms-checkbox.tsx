import type { ReactNode } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { getValueAtPath } from "@/lib/application/object-path";
import type { ApplicationFormValues } from "@/lib/application/types";
import { Controller, useFormContext } from "react-hook-form";
import type { FieldPath } from "react-hook-form";

interface TermsCheckboxProps {
  fieldPath: FieldPath<ApplicationFormValues>;
  children: ReactNode;
  optional?: boolean;
}

export function TermsCheckbox({ fieldPath, children, optional }: TermsCheckboxProps) {
  const { control, formState } = useFormContext<ApplicationFormValues>();
  const error = getValueAtPath(formState.errors, fieldPath) as { message?: string } | undefined;
  const isInvalid = Boolean(error);

  return (
    <Field data-invalid={isInvalid} orientation="horizontal">
      <div className="flex flex-col gap-2">
        <Controller
          name={fieldPath}
          control={control}
          render={({ field }) => {
            if (field.value === undefined) {
              field.onChange(false);
            }

            return (
              <div className="flex gap-2">
                <Checkbox
                  id={fieldPath}
                  checked={Boolean(field.value)}
                  onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                  aria-invalid={isInvalid}
                />
                <FieldLabel htmlFor={fieldPath} isRequired={!optional}>
                  {children}
                </FieldLabel>
              </div>
            );
          }}
        />
        <FieldError errors={error ? [error] : undefined} />
      </div>
    </Field>
  );
}
