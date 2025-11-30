import { ProgressBar } from "@/components/features/application/progress-bar";
import { TermsCheckbox } from "@/components/features/application/terms-checkbox";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldLabel, FieldSet } from "@/components/ui/field";
import { ScrollFade } from "@/components/ui/scroll-fade";
import { useHackathon } from "@/hooks/use-hackathon";
import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import { formatAnswerForReview } from "@/lib/application/review-format";
import type { ApplicationFormValues } from "@/lib/application/types";
import type { ApplicantDraft } from "@/lib/firebase/types/applicants";
import type {
  HackerApplicationNonWelcomeQuestion,
  HackerApplicationSections,
} from "@/lib/firebase/types/hacker-app-questions";
import { useApplicantStore } from "@/lib/stores/applicant-store";
import { useApplicationQuestionStore } from "@/lib/stores/application-question-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { submitApplicantDraft } from "@/services/applicants";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { Fragment, useState } from "react";
import { useFormContext } from "react-hook-form";

export const Route = createFileRoute("/$activeHackathon/_auth/application/review")({
  component: RouteComponent,
});

function renderReviewField(
  section: Omit<HackerApplicationSections, "Welcome">,
  question: HackerApplicationNonWelcomeQuestion,
  applicantDraft: ApplicantDraft | null,
) {
  const value = formatAnswerForReview(section, question, applicantDraft);
  const isNotAnswered = value === "Not answered";

  return (
    <Field key={question._id}>
      <FieldLabel className="font-medium text-md">{question.title ?? "Untitled"}</FieldLabel>
      <FieldContent>
        <p className={`text-sm ${isNotAnswered ? "text-text-secondary" : "text-text-primary"}`}>
          {value}
        </p>
      </FieldContent>
    </Field>
  );
}

function RouteComponent() {
  const { activeHackathon } = useHackathon();
  const { dbCollectionName } = useHackathonInfo();
  const basicInfoQuestions = useApplicationQuestionStore((state) => state.basicInfoQuestions);
  const skillsQuestions = useApplicationQuestionStore((state) => state.skillsQuestions);
  const questionnaireQuestions = useApplicationQuestionStore(
    (state) => state.questionnaireQuestions,
  );
  const applicantDraft = useApplicantStore((state) => state.applicantDraft);
  const user = useAuthStore((state) => state.user);
  const form = useFormContext<ApplicationFormValues>();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const handleSubmitApplication = () => {
    setHasAttemptedSubmit(true);
    form.handleSubmit(async () => {
      const uid = user?.uid;
      const draft = useApplicantStore.getState().applicantDraft;

      if (!dbCollectionName || !uid || !draft) {
        console.error("Cannot submit application: missing dbCollectionName, user or draft");
        return;
      }

      try {
        setSubmitting(true);
        const submittedDraft = await submitApplicantDraft(dbCollectionName, uid, draft);

        useApplicantStore.setState({
          applicantDraft: submittedDraft,
          dirty: false,
        });

        await router.navigate({
          to: "/$activeHackathon/application",
          params: { activeHackathon },
        });
      } catch (error) {
        console.error("Failed to persist submitted application", error);
      } finally {
        setSubmitting(false);
      }
    })();
  };

  return (
    <div className="flex h-full">
      <div className="flex flex-1 gap-16 px-6 py-2">
        <ProgressBar step={4} />
        <div className="flex min-h-0 flex-1 flex-col justify-between gap-10 overflow-hidden">
          <ScrollFade className="flex flex-col gap-16">
            <h1 className="font-semibold text-2xl">Review your application</h1>

            <div className="space-y-20">
              <FieldSet className="space-y-3">
                <h1 className="font-medium text-xl">👋 Tell us a little bit about yourself</h1>
                <div className="grid grid-cols-1 gap-x-10 gap-y-14 md:grid-cols-2">
                  {basicInfoQuestions.map((question) => {
                    if (question.type === "Full Legal Name") {
                      return (
                        <Fragment key={question._id}>
                          <Field>
                            <FieldLabel className="font-medium text-md">
                              Legal first name
                            </FieldLabel>
                            <FieldContent>
                              <p
                                className={`text-sm ${applicantDraft?.basicInfo?.legalFirstName?.trim() ? "text-text-primary" : "text-text-secondary"}`}
                              >
                                {applicantDraft?.basicInfo?.legalFirstName?.trim() ||
                                  "Not answered"}
                              </p>
                            </FieldContent>
                          </Field>
                          <Field>
                            <FieldLabel className="font-medium text-md">Legal last name</FieldLabel>
                            <FieldContent>
                              <p
                                className={`text-sm ${applicantDraft?.basicInfo?.legalLastName?.trim() ? "text-text-primary" : "text-text-secondary"}`}
                              >
                                {applicantDraft?.basicInfo?.legalLastName?.trim() || "Not answered"}
                              </p>
                            </FieldContent>
                          </Field>
                        </Fragment>
                      );
                    }

                    return renderReviewField("BasicInfo", question, applicantDraft);
                  })}
                </div>
              </FieldSet>

              <FieldSet className="space-y-3">
                <h1 className="font-medium text-xl">👀 Academic background</h1>
                <div className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
                  {skillsQuestions.map((question) => {
                    if (question.type === "Portfolio") {
                      const skills = applicantDraft?.skills ?? {};

                      const formatLink = (value: unknown) => {
                        const raw = typeof value === "string" ? value.trim() : "";
                        return raw || "Not answered";
                      };

                      const formatResume = (value: unknown) => {
                        const raw = typeof value === "string" ? value.trim() : "";
                        if (!raw) return "Not uploaded";
                        return "Uploaded";
                      };

                      const items: Array<{
                        key: string;
                        label: string;
                        value: string;
                        isNotAnswered: boolean;
                      }> = [
                        {
                          key: "resume",
                          label: "Resume",
                          value: formatResume(skills.resume),
                          isNotAnswered: formatResume(skills.resume) === "Not uploaded",
                        },
                        {
                          key: "linkedin",
                          label: "LinkedIn",
                          value: formatLink(skills.linkedin),
                          isNotAnswered: formatLink(skills.linkedin) === "Not answered",
                        },
                        {
                          key: "github",
                          label: "GitHub",
                          value: formatLink(skills.github),
                          isNotAnswered: formatLink(skills.github) === "Not answered",
                        },
                        {
                          key: "portfolio",
                          label: "Portfolio",
                          value: formatLink(skills.portfolio),
                          isNotAnswered: formatLink(skills.portfolio) === "Not answered",
                        },
                      ];

                      return (
                        <Fragment key={question._id}>
                          {items.map((item) => (
                            <Field key={item.key}>
                              <FieldLabel className="font-medium text-md">{item.label}</FieldLabel>
                              <FieldContent>
                                <p
                                  className={`text-sm ${item.isNotAnswered ? "text-text-secondary" : "text-text-primary"}`}
                                >
                                  {item.value}
                                </p>
                              </FieldContent>
                            </Field>
                          ))}
                        </Fragment>
                      );
                    }

                    return renderReviewField("Skills", question, applicantDraft);
                  })}
                </div>
              </FieldSet>

              <FieldSet className="space-y-3">
                <h1 className="font-medium text-xl">📝 Questionnaire</h1>
                <div className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
                  {questionnaireQuestions.map((question) => {
                    return renderReviewField("Questionnaire", question, applicantDraft);
                  })}
                </div>
              </FieldSet>

              <FieldSet>
                <h1 className="font-medium text-xl">🔒 Terms and conditions</h1>
                <TermsCheckbox fieldPath="termsAndConditions.MLHCodeOfConduct">
                  I have read and agree to the{" "}
                  <a
                    href="https://mlh.io/code-of-conduct"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    MLH Code of Conduct
                  </a>
                  .
                </TermsCheckbox>
                <TermsCheckbox fieldPath="termsAndConditions.MLHPrivacyPolicy">
                  I authorize MLH to share my application/registration information with MLH for
                  event administration, ranking, and MLH administration.
                </TermsCheckbox>
                <TermsCheckbox fieldPath="termsAndConditions.nwPlusPrivacyPolicy">
                  I agree to the{" "}
                  <a
                    href="https://nwplus.io/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    nwPlus Privacy Policy
                  </a>
                  .
                </TermsCheckbox>
                <TermsCheckbox fieldPath="termsAndConditions.shareWithnwPlus">
                  I agree that my application data may be used internally by nwPlus.
                </TermsCheckbox>
                <TermsCheckbox fieldPath="termsAndConditions.shareWithSponsors" optional>
                  I agree that my application data may be shared with sponsors.
                </TermsCheckbox>
                <TermsCheckbox fieldPath="termsAndConditions.MLHEmailSubscription" optional>
                  I would like to receive emails from MLH about future events.
                </TermsCheckbox>
              </FieldSet>
            </div>
          </ScrollFade>

          {hasAttemptedSubmit && Object.keys(form.formState.errors).length > 0 && (
            <p className="text-sm text-text-error">
              One or more answers are still missing. Use the back button to revisit each section.
            </p>
          )}

          <div className="flex justify-between">
            <Button variant="secondary" asChild>
              <Link to="/$activeHackathon/application/questionnaire" params={{ activeHackathon }}>
                ← Back
              </Link>
            </Button>
            <Button variant="primary" onClick={handleSubmitApplication} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit application"}
            </Button>
          </div>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center"> right side </div>
    </div>
  );
}
