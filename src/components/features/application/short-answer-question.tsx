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

export function ShortAnswerQuestion(props: QuestionFieldProps) {
  const { register, label, description, isRequired, mainPath, mainId, mainError, isMainInvalid } =
    useQuestionFieldConfig(props);

  if (!mainPath) return null;

  return (
    <Field data-invalid={isMainInvalid}>
      <FieldLabel htmlFor={mainId} isRequired={isRequired}>
        {label}
      </FieldLabel>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldContent>
        <Input id={mainId} aria-invalid={isMainInvalid} {...register(mainPath)} />
        <FieldError errors={mainError ? [mainError] : undefined} />
      </FieldContent>
    </Field>
  );
}
