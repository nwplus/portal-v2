import type { QuestionFieldProps } from "@/components/features/application/question-field";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useQuestionFieldConfig } from "@/hooks/use-question-field-config";
import type { ApplicationFormValues } from "@/lib/application/types";
import type { FieldPath } from "react-hook-form";

/**
 * Renders a multi-line style text input for "Long Answer" questions.
 *
 * Uses the shared Textarea component but keeps the same form wiring
 * as short answer questions.
 */
export function LongAnswerQuestion(props: QuestionFieldProps) {
  const {
    register,
    watch,
    question,
    label,
    description,
    isRequired,
    mainPath,
    mainId,
    mainError,
    isMainInvalid,
  } = useQuestionFieldConfig(props);

  if (!mainPath) return null;

  const fieldPath = mainPath as FieldPath<ApplicationFormValues>;

  const maxWordsRaw = question.maxWords;
  const maxWords = maxWordsRaw ? Number.parseInt(maxWordsRaw, 10) : undefined;

  const currentValue = watch(fieldPath) ?? "";
  const currentWordCount =
    typeof currentValue === "string" ? currentValue.trim().split(/\s+/).filter(Boolean).length : 0;

  const isOverWordLimit =
    typeof maxWords === "number" && maxWords > 0 && currentWordCount > maxWords;

  return (
    <Field data-invalid={isMainInvalid}>
      <FieldLabel htmlFor={mainId} isRequired={isRequired}>
        {label}
      </FieldLabel>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldContent>
        <FieldError errors={mainError ? [mainError] : undefined} />
        <Textarea id={mainId} aria-invalid={isMainInvalid} {...register(fieldPath)} />
        {typeof maxWords === "number" && maxWords > 0 ? (
          <div className="mt-1 flex items-center justify-between text-text-secondary text-xs">
            <span>
              {currentWordCount} {currentWordCount === 1 ? "word" : "words"}
            </span>
            <span className={isOverWordLimit ? "text-text-error" : undefined}>
              Max {maxWords} words
            </span>
          </div>
        ) : null}
      </FieldContent>
    </Field>
  );
}
