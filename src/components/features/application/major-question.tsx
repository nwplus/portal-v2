import type { QuestionFieldProps } from "@/components/features/application/question-field";
import { Dropdown } from "@/components/ui/dropdown";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ApplicationFormValues } from "@/lib/application/types";
import { MAJOR_KEYS, MAJOR_OPTIONS } from "@/lib/data/majors";
import type { ApplicantMajor } from "@/lib/firebase/types/applicants";
import { Controller, useFormContext } from "react-hook-form";
import type { FieldPath } from "react-hook-form";

export function MajorQuestion({ question }: QuestionFieldProps) {
  const {
    control,
    register,
    setValue,
    clearErrors,
    trigger,
    formState: { errors },
  } = useFormContext<ApplicationFormValues>();

  const label = question.title;
  const description = question.description;
  const isRequired = Boolean(question.required);

  const majorPath = "basicInfo.major";
  const otherMajorPath = "basicInfo.otherMajor" as FieldPath<ApplicationFormValues>;
  const majorError = errors.basicInfo?.major as { message?: string } | undefined;
  const otherMajorError = (errors.basicInfo as Record<string, unknown>)?.otherMajor as
    | { message?: string }
    | undefined;
  const isMajorInvalid = Boolean(majorError);
  const isOtherInvalid = Boolean(otherMajorError);
  const isInvalid = isMajorInvalid || isOtherInvalid;
  const errorMessage = otherMajorError ?? majorError;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel isRequired={isRequired}>{label}</FieldLabel>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldContent>
        <Controller
          name={majorPath}
          control={control}
          render={({ field }) => {
            const record = (field.value ?? {}) as Record<string, boolean>;

            const selectedKey =
              (MAJOR_KEYS.find((key) => record[key]) as ApplicantMajor | undefined) ?? null;

            const isOtherSelected = Boolean(record.other);

            return (
              <div className="space-y-2">
                <Dropdown
                  items={MAJOR_KEYS as ApplicantMajor[]}
                  value={selectedKey}
                  onValueChange={(value) => {
                    const key = (value as ApplicantMajor | null) ?? null;

                    const nextRecord: Record<string, boolean> = {};
                    for (const k of MAJOR_KEYS) {
                      nextRecord[k] = Boolean(key && k === key);
                    }

                    field.onChange(nextRecord);

                    if (key !== "other") {
                      setValue(otherMajorPath, "");
                      clearErrors(otherMajorPath);
                    }

                    void trigger(majorPath);
                  }}
                  itemToString={(key) => (key ? MAJOR_OPTIONS[key as ApplicantMajor] : "")}
                  itemToKey={(key) => key}
                  name={field.name}
                  invalid={isMajorInvalid}
                  onBlur={field.onBlur}
                />

                {isOtherSelected ? (
                  <Input
                    id={otherMajorPath}
                    placeholder="Please specify"
                    aria-invalid={isOtherInvalid}
                    {...register(otherMajorPath)}
                  />
                ) : null}
              </div>
            );
          }}
        />
        <FieldError errors={errorMessage ? [errorMessage] : undefined} />
      </FieldContent>
    </Field>
  );
}
