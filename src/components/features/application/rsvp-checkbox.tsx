import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import type { ReactNode } from "react";
import { Controller, useFormContext } from "react-hook-form";

interface RsvpCheckboxProps {
  name: string;
  label: string;
  checkboxLabel: string;
  description?: ReactNode;
  required?: boolean;
}

export function RsvpCheckbox({
  name,
  label,
  checkboxLabel,
  description,
  required,
}: RsvpCheckboxProps) {
  const { control, formState, trigger } = useFormContext();
  const error = formState.errors[name] as { message?: string } | undefined;
  const isInvalid = Boolean(error);

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel isRequired={required} className="font-medium text-md">
        {label}
      </FieldLabel>
      {description && (
        <FieldDescription className="text-sm text-text-primary [&>a:hover]:text-text-primary/80 [&>a]:text-text-primary">
          {description}
        </FieldDescription>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="flex items-start gap-2">
            <Checkbox
              id={name}
              checked={field.value}
              onCheckedChange={(checked) => {
                field.onChange(Boolean(checked));
                trigger(name);
              }}
              aria-invalid={isInvalid}
              className="mt-0.5"
            />
            <FieldLabel htmlFor={name} className="font-normal text-sm">
              {checkboxLabel}
            </FieldLabel>
          </div>
        )}
      />
      {required && <FieldError errors={error ? [error] : undefined} />}
    </Field>
  );
}
