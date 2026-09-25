import type { QuestionFieldProps } from "@/components/features/application/question-field";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { useQuestionFieldConfig } from "@/hooks/use-question-field-config";
import type { ApplicationFormValues } from "@/lib/application/types";
import { useAuthStore } from "@/lib/stores/auth-store";
import { uploadResumeToStorage } from "@/services/applicants";
import { type ChangeEvent, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import type { FieldPath } from "react-hook-form";

export function ResumeQuestion({ section, question }: QuestionFieldProps) {
  const form = useFormContext<ApplicationFormValues>();
  const { watch, setValue, setError, clearErrors } = form;

  const { label, description, isRequired, mainPath, mainId, mainError, isMainInvalid } =
    useQuestionFieldConfig({ section, question });

  const user = useAuthStore((state) => state.user);
  const userId = user?.uid ?? null;
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const resumeFileInputRef = useRef<HTMLInputElement | null>(null);

  const resumePath = mainPath;

  const currentResumeUrl =
    resumePath != null ? watch(resumePath as FieldPath<ApplicationFormValues>) : undefined;

  const resumeStatus = resumeFileName
    ? `${resumeFileName} uploaded`
    : currentResumeUrl
      ? "Resume uploaded"
      : "No file uploaded";

  const handleResumeFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !resumePath) return;

    const allowedExtensions = [".pdf", ".doc", ".docx", ".png", ".jpg"];
    const lowerName = file.name.toLowerCase();
    const hasAllowedExtension = allowedExtensions.some((ext) => lowerName.endsWith(ext));
    const maxBytes = 3 * 1024 * 1024;

    if (!hasAllowedExtension) {
      setError(resumePath as FieldPath<ApplicationFormValues>, {
        type: "manual",
        message: "Accepted types: .pdf, .doc, .docx, .png, .jpg",
      });
      event.target.value = "";
      return;
    }

    if (file.size > maxBytes) {
      setError(resumePath as FieldPath<ApplicationFormValues>, {
        type: "manual",
        message: "File must be 3MB or smaller",
      });
      event.target.value = "";
      return;
    }

    if (!userId) {
      setError(resumePath as FieldPath<ApplicationFormValues>, {
        type: "manual",
        message: "You must be signed in to upload a resume",
      });
      event.target.value = "";
      return;
    }

    setUploadingResume(true);
    clearErrors(resumePath as FieldPath<ApplicationFormValues>);

    try {
      const url = await uploadResumeToStorage(userId, file);
      if (!url) {
        setError(resumePath as FieldPath<ApplicationFormValues>, {
          type: "manual",
          message: "Upload failed, please try again",
        });
        return;
      }

      setResumeFileName(file.name);
      setValue(resumePath as FieldPath<ApplicationFormValues>, url, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch {
      setError(resumePath as FieldPath<ApplicationFormValues>, {
        type: "manual",
        message: "Upload failed, please try again",
      });
    } finally {
      setUploadingResume(false);
      event.target.value = "";
    }
  };

  return (
    <Field data-invalid={isMainInvalid}>
      <FieldLabel isRequired={isRequired}>{label}</FieldLabel>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldContent>
        <div className="space-y-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => resumeFileInputRef.current?.click()}
            disabled={uploadingResume || !userId}
            aria-invalid={isMainInvalid}
          >
            {uploadingResume ? "Uploading…" : "Upload"}
          </Button>
          <p className="text-text-secondary text-xs">
            {resumeStatus}. Accepted formats: pdf, doc, docx, png, jpg (max 3MB)
          </p>
          <input
            ref={resumeFileInputRef}
            id={mainId}
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg"
            className="hidden"
            onChange={handleResumeFileChange}
          />
          <FieldError errors={mainError ? [mainError] : undefined} />
        </div>
      </FieldContent>
    </Field>
  );
}
