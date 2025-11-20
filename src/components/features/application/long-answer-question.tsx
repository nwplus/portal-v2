import type { QuestionFieldProps } from "@/components/features/application/question-field";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useQuestionFieldConfig } from "@/hooks/use-question-field-config";
import type { ApplicationFormValues } from "@/lib/application/types";
import type { FieldPath } from "react-hook-form";

/**
 * Renders a multi-line style text input for "Long Answer" questions.
 *
 * For now this reuses the same Input as Short Answer; swapping to a textarea
 * later only requires changing this component, not the form wiring.
 */
export function LongAnswerQuestion(props: QuestionFieldProps) {
  const { register, label, description, isRequired, mainPath, mainId, mainError, isMainInvalid } =
    useQuestionFieldConfig(props);

  if (!mainPath) return null;

  return (
    <Field data-invalid={isMainInvalid}>
      <FieldLabel htmlFor={mainId}>
        {label}
        {isRequired ? <span className="text-border-danger"> *</span> : null}
      </FieldLabel>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldContent>
        <Input
          id={mainId}
          aria-invalid={isMainInvalid}
          {...register(mainPath as FieldPath<ApplicationFormValues>)}
        />
        <FieldError errors={mainError ? [mainError] : undefined} />
      </FieldContent>
    </Field>
  );
}
