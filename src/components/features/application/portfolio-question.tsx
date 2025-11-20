import type { QuestionFieldProps } from "@/components/features/application/question-field";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { buildFieldPath } from "@/lib/application/form-mapping";
import { getValueAtPath } from "@/lib/application/object-path";
import type { ApplicationFormValues } from "@/lib/application/types";
import { normalizeUrl } from "@/lib/application/utils";
import { useAuthStore } from "@/lib/stores/auth-store";
import { uploadResumeToStorage } from "@/services/applicants";
import type * as React from "react";
import { useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import type { FieldPath } from "react-hook-form";

/**
 * Renders the grouped "Portfolio" question:
 * - Resume upload (required when the group is required)
 * - LinkedIn URL
 * - GitHub URL
 * - Portfolio URL
 *
 * This component owns the fan-out into multiple Skills fields and the resume
 * upload behavior, while still plugging into the shared ApplicationFormValues form.
 */
export function PortfolioQuestion({ question }: QuestionFieldProps) {
  const form = useFormContext<ApplicationFormValues>();
  const { register, watch, formState, setValue, setError, clearErrors } = form;

  const user = useAuthStore((state) => state.user);
  const userId = user?.uid ?? null;
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeFileNameOverride, setResumeFileNameOverride] = useState<string | null>(null);
  const resumeFileInputRef = useRef<HTMLInputElement | null>(null);

  const label = question.title ?? "Untitled";
  const description = question.description;
  const isRequired = Boolean(question.required);

  const resumePath = buildFieldPath("Skills", "resume");
  const linkedinPath = buildFieldPath("Skills", "linkedin");
  const githubPath = buildFieldPath("Skills", "github");
  const portfolioPath = buildFieldPath("Skills", "portfolio");

  const resumeId = resumePath ? resumePath.replace(".", "-") : undefined;
  const linkedinId = linkedinPath ? linkedinPath.replace(".", "-") : undefined;
  const githubId = githubPath ? githubPath.replace(".", "-") : undefined;
  const portfolioId = portfolioPath ? portfolioPath.replace(".", "-") : undefined;

  const resumeError =
    resumePath && formState.errors
      ? (getValueAtPath(formState.errors, resumePath) as { message?: string } | undefined)
      : undefined;
  const linkedinError =
    linkedinPath && formState.errors
      ? (getValueAtPath(formState.errors, linkedinPath) as { message?: string } | undefined)
      : undefined;
  const githubError =
    githubPath && formState.errors
      ? (getValueAtPath(formState.errors, githubPath) as { message?: string } | undefined)
      : undefined;
  const portfolioError =
    portfolioPath && formState.errors
      ? (getValueAtPath(formState.errors, portfolioPath) as { message?: string } | undefined)
      : undefined;

  const currentResumeUrl =
    resumePath != null ? watch(resumePath as FieldPath<ApplicationFormValues>) : undefined;

  const deriveResumeFileName = (url: unknown): string | null => {
    if (typeof url !== "string" || !url.trim()) return null;
    try {
      const parsed = new URL(url);
      const lastSegment = parsed.pathname.split("/").pop();
      if (!lastSegment) return null;
      const decoded = decodeURIComponent(lastSegment);
      const name = decoded.split("/").pop();
      return name && name !== "applicantResumes" ? name : null;
    } catch {
      return null;
    }
  };

  const resumeFileName = resumeFileNameOverride ?? deriveResumeFileName(currentResumeUrl);

  const isAnyInvalid = Boolean(resumeError || linkedinError || githubError || portfolioError);

  const handleResumeFileChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !resumePath) {
      return;
    }

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

      setResumeFileNameOverride(file.name);
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
    <Field data-invalid={isAnyInvalid}>
      <FieldTitle>
        {label}
        {isRequired ? <span className="text-border-danger"> *</span> : null}
      </FieldTitle>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldContent>
        <div className="space-y-4">
          {/* Resume upload */}
          {resumePath ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <FieldLabel htmlFor={resumeId} className="font-normal text-sm">
                  Resume
                  {isRequired ? <span className="text-border-danger"> *</span> : null}
                </FieldLabel>
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary text-xs">
                    {resumeFileName
                      ? `${resumeFileName} uploaded`
                      : currentResumeUrl
                        ? "Resume uploaded"
                        : "No file uploaded"}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => resumeFileInputRef.current?.click()}
                    disabled={uploadingResume || !userId}
                    aria-invalid={Boolean(resumeError)}
                  >
                    {uploadingResume ? "Uploading…" : "Upload"}
                  </Button>
                </div>
              </div>
              <input
                ref={resumeFileInputRef}
                id={resumeId}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg"
                className="hidden"
                onChange={handleResumeFileChange}
              />
              <FieldError errors={resumeError ? [resumeError] : undefined} />
            </div>
          ) : null}

          {/* LinkedIn */}
          {linkedinPath ? (
            <div className="space-y-1">
              <FieldLabel htmlFor={linkedinId} className="font-normal text-sm">
                LinkedIn
              </FieldLabel>
              <Input
                id={linkedinId}
                placeholder="https://"
                aria-invalid={Boolean(linkedinError)}
                {...register(linkedinPath as FieldPath<ApplicationFormValues>, {
                  setValueAs: (value) => normalizeUrl(value),
                })}
              />
              <FieldError errors={linkedinError ? [linkedinError] : undefined} />
            </div>
          ) : null}

          {/* GitHub */}
          {githubPath ? (
            <div className="space-y-1">
              <FieldLabel htmlFor={githubId} className="font-normal text-sm">
                GitHub
              </FieldLabel>
              <Input
                id={githubId}
                placeholder="https://"
                aria-invalid={Boolean(githubError)}
                {...register(githubPath as FieldPath<ApplicationFormValues>, {
                  setValueAs: (value) => normalizeUrl(value),
                })}
              />
              <FieldError errors={githubError ? [githubError] : undefined} />
            </div>
          ) : null}

          {/* Portfolio URL */}
          {portfolioPath ? (
            <div className="space-y-1">
              <FieldLabel htmlFor={portfolioId} className="font-normal text-sm">
                Portfolio
              </FieldLabel>
              <Input
                id={portfolioId}
                placeholder="https://"
                aria-invalid={Boolean(portfolioError)}
                {...register(portfolioPath as FieldPath<ApplicationFormValues>, {
                  setValueAs: (value) => normalizeUrl(value),
                })}
              />
              <FieldError errors={portfolioError ? [portfolioError] : undefined} />
            </div>
          ) : null}
        </div>
      </FieldContent>
    </Field>
  );
}
