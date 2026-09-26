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
import { normalizeUrl } from "@/lib/application/utils";

const PLACEHOLDER_BY_TYPE: Record<string, string> = {
  Github: "https://github.com/your-username",
  LinkedIn: "https://linkedin.com/in/your-profile",
  "Portfolio Website": "https://your-portfolio.com",
};

export function LinkQuestion({ section, question }: QuestionFieldProps) {
  const { register, label, description, isRequired, mainPath, mainId, mainError, isMainInvalid } =
    useQuestionFieldConfig({ section, question });

  if (!mainPath) return null;

  const placeholder = PLACEHOLDER_BY_TYPE[question.type] ?? "https://example.com";

  return (
    <Field data-invalid={isMainInvalid}>
      <FieldLabel htmlFor={mainId} isRequired={isRequired}>
        {label}
      </FieldLabel>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldContent>
        <Input
          id={mainId}
          placeholder={placeholder}
          aria-invalid={isMainInvalid}
          {...register(mainPath, { setValueAs: normalizeUrl })}
        />
        <FieldError errors={mainError ? [mainError] : undefined} />
      </FieldContent>
    </Field>
  );
}
