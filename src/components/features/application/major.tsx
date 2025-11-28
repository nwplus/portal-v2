import type { QuestionFieldProps } from "@/components/features/application/question-field";
import { Dropdown } from "@/components/ui/dropdown";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import type { ApplicationFormValues } from "@/lib/application/types";
import { MAJOR_KEYS, MAJOR_OPTIONS } from "@/lib/data/majors";
import type { ApplicantMajor } from "@/lib/firebase/types/applicants";
import { Controller, useFormContext } from "react-hook-form";
import type { FieldPath } from "react-hook-form";

/**
 * Renders the fixed "Major" question as a dropdown backed by MAJOR_OPTIONS.
 *
 * The underlying value persisted to the form (and eventually the DB) is the
 * ApplicantMajor key (e.g. "computerScience"), while the human-readable label
 * (e.g. "Computer science, computer engineering, or software engineering")
 * is shown in the UI.
 */
export function MajorQuestion({ question }: QuestionFieldProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ApplicationFormValues>();

  const label = question.title;
  const description = question.description;
  const isRequired = Boolean(question.required);

  const majorPath = "basicInfo.major" as FieldPath<ApplicationFormValues>;
  const otherMajorPath = "basicInfo.otherMajor" as FieldPath<ApplicationFormValues>;
  const majorError = errors.basicInfo?.major as { message?: string } | undefined;
  const otherMajorError = (errors.basicInfo as Record<string, unknown>)?.otherMajor as
    | { message?: string }
    | undefined;
  const isMajorInvalid = Boolean(majorError);
  const isOtherInvalid = Boolean(otherMajorError);
  const isInvalid = isMajorInvalid || isOtherInvalid;

  const majorItems = MAJOR_KEYS as ApplicantMajor[];

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel isRequired={isRequired}>{label}</FieldLabel>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldContent>
        <Controller
          name={majorPath}
          control={control}
          render={({ field }) => (
            <div className="space-y-2">
              <Dropdown
                items={majorItems}
                value={(field.value as ApplicantMajor | null) ?? null}
                onValueChange={(value) => field.onChange((value as ApplicantMajor | null) ?? "")}
                itemToString={(key) => (key ? MAJOR_OPTIONS[key as ApplicantMajor] : "")}
                itemToKey={(key) => key}
                name={field.name}
                invalid={isMajorInvalid}
                onBlur={field.onBlur}
              />

              {/* TODO: replace with dropdown creatable */}
              {field.value === "other" ? (
                <div className="space-y-1">
                  <label className="font-normal text-xs" htmlFor="basicInfo-otherMajor">
                    Other (please specify)
                  </label>
                  <input
                    id="basicInfo-otherMajor"
                    className="h-10 w-full rounded-md border border-border-subtle bg-bg-text-field px-3.5 text-sm text-text-primary placeholder:text-text-secondary focus:border-border-active focus:ring-2 focus:ring-border-active/20 aria-invalid:border-border-danger aria-invalid:ring-border-danger/20"
                    aria-invalid={isOtherInvalid}
                    {...register(otherMajorPath)}
                  />
                </div>
              ) : null}
            </div>
          )}
        />
        <FieldError errors={[majorError, otherMajorError]} />
      </FieldContent>
    </Field>
  );
}
