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
 * Renders a single-line text input for "Short Answer" questions.
 *
 * Uses useQuestionFieldConfig to:
 * - Bind the input to the correct RHF path.
 * - Display validation errors for this question.
 * - Attach the label to the input via mainId.
 */
export function ShortAnswerQuestion(props: QuestionFieldProps) {
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
