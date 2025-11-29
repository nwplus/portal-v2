import type { QuestionFieldProps } from "@/components/features/application/question-field";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { buildFieldPath } from "@/lib/application/form-mapping";
import type { ApplicationFormValues } from "@/lib/application/types";
import { useFormContext } from "react-hook-form";
import type { FieldPath } from "react-hook-form";

export function FullLegalNameQuestion({ question }: QuestionFieldProps) {
  const form = useFormContext<ApplicationFormValues>();
  const {
    register,
    formState: { errors },
  } = form;

  const label = question.title ?? "Untitled";
  const description = question.description;
  const isRequired = Boolean(question.required);

  const firstNamePath = buildFieldPath("BasicInfo", "legalFirstName");
  const lastNamePath = buildFieldPath("BasicInfo", "legalLastName");
  const firstNameId = firstNamePath ? firstNamePath.replace(".", "-") : undefined;
  const lastNameId = lastNamePath ? lastNamePath.replace(".", "-") : undefined;

  const firstNameError = errors.basicInfo?.legalFirstName as { message?: string } | undefined;
  const lastNameError = errors.basicInfo?.legalLastName as { message?: string } | undefined;
  const isFirstInvalid = Boolean(firstNameError);
  const isLastInvalid = Boolean(lastNameError);
  const isAnyInvalid = isFirstInvalid || isLastInvalid;

  return (
    <Field data-invalid={isAnyInvalid}>
      <FieldLabel>{label}</FieldLabel>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldContent>
        {firstNamePath ? (
          <div className="space-y-1">
            <FieldLabel htmlFor={firstNameId} isRequired={isRequired}>
              Legal first name
            </FieldLabel>
            <Input
              id={firstNameId}
              aria-invalid={isFirstInvalid}
              {...register(firstNamePath as FieldPath<ApplicationFormValues>)}
            />
            <FieldError errors={firstNameError ? [firstNameError] : undefined} />
          </div>
        ) : null}
        {lastNamePath ? (
          <div className="space-y-1">
            <FieldLabel htmlFor={lastNameId} isRequired={isRequired}>
              Legal last name
            </FieldLabel>
            <Input
              id={lastNameId}
              aria-invalid={isLastInvalid}
              {...register(lastNamePath as FieldPath<ApplicationFormValues>)}
            />
            <FieldError errors={lastNameError ? [lastNameError] : undefined} />
          </div>
        ) : null}
      </FieldContent>
    </Field>
  );
}
