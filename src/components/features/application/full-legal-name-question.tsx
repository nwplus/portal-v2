import type { QuestionFieldProps } from "@/components/features/application/question-field";
import { Field, FieldContent, FieldDescription, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { buildFieldPath } from "@/lib/application/form-mapping";
import type { ApplicationFormValues } from "@/lib/application/types";
import { useFormContext } from "react-hook-form";
import type { FieldPath } from "react-hook-form";

/**
 * Renders the grouped "Full Legal Name" question.
 *
 * This question fans out into two BasicInfo fields:
 * - basicInfo.legalFirstName
 * - basicInfo.legalLastName
 */
export function FullLegalNameQuestion({ question }: QuestionFieldProps) {
  const form = useFormContext<ApplicationFormValues>();
  const { register } = form;

  const label = question.title ?? "Untitled";
  const description = question.description;
  const isRequired = Boolean(question.required);

  const firstNamePath = buildFieldPath("BasicInfo", "legalFirstName");
  const lastNamePath = buildFieldPath("BasicInfo", "legalLastName");
  const firstNameId = firstNamePath ? firstNamePath.replace(".", "-") : undefined;
  const lastNameId = lastNamePath ? lastNamePath.replace(".", "-") : undefined;

  return (
    <Field>
      <FieldTitle>
        {label}
        {isRequired ? <span className="text-border-danger"> *</span> : null}
      </FieldTitle>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldContent>
        <div className="grid gap-2 md:grid-cols-2">
          {firstNamePath ? (
            <div className="space-y-1">
              <label htmlFor={firstNameId} className="font-medium text-xs">
                Legal first name
              </label>
              <Input
                id={firstNameId}
                aria-invalid={false}
                {...register(firstNamePath as FieldPath<ApplicationFormValues>)}
              />
            </div>
          ) : null}
          {lastNamePath ? (
            <div className="space-y-1">
              <label htmlFor={lastNameId} className="font-medium text-xs">
                Legal last name
              </label>
              <Input
                id={lastNameId}
                aria-invalid={false}
                {...register(lastNamePath as FieldPath<ApplicationFormValues>)}
              />
            </div>
          ) : null}
        </div>
      </FieldContent>
    </Field>
  );
}
