import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import confetti from "canvas-confetti";
import { httpsCallable } from "firebase/functions";
import { Fragment, type ReactNode, useState } from "react";
import { useFormContext } from "react-hook-form";

import { TermsCheckbox } from "@/components/features/application/terms-checkbox";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldLabel, FieldSet } from "@/components/ui/field";
import { ScrollFade } from "@/components/ui/scroll-fade";
import { useHackathon } from "@/hooks/use-hackathon";
import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import { usePortalTheme } from "@/hooks/use-portal-theme";
import { formatAnswerForReview } from "@/lib/application/review-format";
import type { ApplicationFormValues } from "@/lib/application/types";
import { functions } from "@/lib/firebase/client";
import type { ApplicantDraft } from "@/lib/firebase/types/applicants";
import type {
  HackerApplicationNonWelcomeQuestion,
  HackerApplicationSections,
} from "@/lib/firebase/types/hacker-app-questions";
import { useApplicantStore } from "@/lib/stores/applicant-store";
import { useApplicationQuestionStore } from "@/lib/stores/application-question-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { usePortalStore } from "@/lib/stores/portal-store";
import { submitApplicantDraft } from "@/services/applicants";

function fireSideCannons(colors?: string[]) {
  const DURATION_MS = 1500;
  const end = Date.now() + DURATION_MS;

  const frame = () => {
    if (Date.now() > end) return;

    const baseConfig = {
      particleCount: 2,
      spread: 55,
      startVelocity: 60,
      ...(colors && { colors }),
    };

    confetti({ ...baseConfig, angle: 60, origin: { x: 0, y: 0.5 } });
    confetti({ ...baseConfig, angle: 120, origin: { x: 1, y: 0.5 } });

    requestAnimationFrame(frame);
  };

  frame();
}

interface ReviewFieldProps {
  label: string;
  value: string;
  isNotAnswered?: boolean;
}

function ReviewField({ label, value, isNotAnswered }: ReviewFieldProps) {
  return (
    <Field>
      <FieldLabel className="font-medium text-md">{label}</FieldLabel>
      <FieldContent>
        <p className={`text-sm ${isNotAnswered ? "text-text-secondary" : "text-text-primary"}`}>
          {value}
        </p>
      </FieldContent>
    </Field>
  );
}

function QuestionReviewField({
  section,
  question,
  applicantDraft,
}: {
  section: Omit<HackerApplicationSections, "Welcome">;
  question: HackerApplicationNonWelcomeQuestion;
  applicantDraft: ApplicantDraft | null;
}) {
  const value = formatAnswerForReview(section, question, applicantDraft);
  const isNotAnswered = value === "Not answered";

  return (
    <ReviewField
      key={question._id}
      label={question.title ?? "Untitled"}
      value={value}
      isNotAnswered={isNotAnswered}
    />
  );
}

interface ReviewSectionProps {
  title: string;
  emoji: string;
  children: ReactNode;
  className?: string;
}

function ReviewSection({ title, emoji, children, className = "space-y-3" }: ReviewSectionProps) {
  return (
    <FieldSet className={className}>
      <h2 className="font-medium text-xl">
        {emoji} {title}
      </h2>
      {children}
    </FieldSet>
  );
}

function BasicInfoSection({ applicantDraft }: { applicantDraft: ApplicantDraft | null }) {
  const basicInfoQuestions = useApplicationQuestionStore((state) => state.basicInfoQuestions);
  const firstName = applicantDraft?.basicInfo?.legalFirstName?.trim();
  const lastName = applicantDraft?.basicInfo?.legalLastName?.trim();

  return (
    <ReviewSection title="Tell us a little bit about yourself" emoji="👋">
      <div className="grid grid-cols-1 gap-x-10 gap-y-14 md:grid-cols-2">
        {basicInfoQuestions.map((question) => {
          if (question.type === "Full Legal Name") {
            return (
              <Fragment key={question._id}>
                <ReviewField
                  label="Legal first name"
                  value={firstName || "Not answered"}
                  isNotAnswered={!firstName}
                />
                <ReviewField
                  label="Legal last name"
                  value={lastName || "Not answered"}
                  isNotAnswered={!lastName}
                />
              </Fragment>
            );
          }
          return (
            <QuestionReviewField
              key={question._id}
              section="BasicInfo"
              question={question}
              applicantDraft={applicantDraft}
            />
          );
        })}
      </div>
    </ReviewSection>
  );
}

function SkillsSection({ applicantDraft }: { applicantDraft: ApplicantDraft | null }) {
  const skillsQuestions = useApplicationQuestionStore((state) => state.skillsQuestions);
  const skills = applicantDraft?.skills ?? {};

  const formatLink = (value: unknown): string => {
    const raw = typeof value === "string" ? value.trim() : "";
    return raw || "Not answered";
  };

  const formatResume = (value: unknown): string => {
    const raw = typeof value === "string" ? value.trim() : "";
    return raw ? "Uploaded" : "Not uploaded";
  };

  const portfolioItems = [
    {
      key: "resume",
      label: "Resume",
      value: formatResume(skills.resume),
      emptyText: "Not uploaded",
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      value: formatLink(skills.linkedin),
      emptyText: "Not answered",
    },
    { key: "github", label: "GitHub", value: formatLink(skills.github), emptyText: "Not answered" },
    {
      key: "portfolio",
      label: "Portfolio",
      value: formatLink(skills.portfolio),
      emptyText: "Not answered",
    },
  ];

  return (
    <ReviewSection title="Academic background" emoji="👀">
      <div className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
        {skillsQuestions.map((question) => {
          if (question.type === "Portfolio") {
            return (
              <Fragment key={question._id}>
                {portfolioItems.map((item) => (
                  <ReviewField
                    key={item.key}
                    label={item.label}
                    value={item.value}
                    isNotAnswered={item.value === item.emptyText}
                  />
                ))}
              </Fragment>
            );
          }
          return (
            <QuestionReviewField
              key={question._id}
              section="Skills"
              question={question}
              applicantDraft={applicantDraft}
            />
          );
        })}
      </div>
    </ReviewSection>
  );
}

function QuestionnaireSection({ applicantDraft }: { applicantDraft: ApplicantDraft | null }) {
  const questionnaireQuestions = useApplicationQuestionStore(
    (state) => state.questionnaireQuestions,
  );

  return (
    <ReviewSection title="Questionnaire" emoji="📝">
      <div className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
        {questionnaireQuestions.map((question) => (
          <QuestionReviewField
            key={question._id}
            section="Questionnaire"
            question={question}
            applicantDraft={applicantDraft}
          />
        ))}
      </div>
    </ReviewSection>
  );
}

function TermsSection() {
  return (
    <ReviewSection title="Terms and conditions" emoji="🔒" className="">
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
        I authorize MLH to share my application/registration information with MLH for event
        administration, ranking, and MLH administration.
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
    </ReviewSection>
  );
}

export const Route = createFileRoute("/$activeHackathon/_auth/application/_step-layout/review")({
  component: RouteComponent,
});

function RouteComponent() {
  const { activeHackathon } = useHackathon();
  const { dbCollectionName, displayNameFull } = useHackathonInfo();
  const portalTheme = usePortalTheme();
  const applicantDraft = useApplicantStore((state) => state.applicantDraft);
  const user = useAuthStore((state) => state.user);
  const applicationsOpen = usePortalStore((state) => state.applicationsOpen);
  const form = useFormContext<ApplicationFormValues>();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const confettiColors = portalTheme?.[activeHackathon]?.portalGradient;
  const hasValidationErrors = hasAttemptedSubmit && Object.keys(form.formState.errors).length > 0;

  const handleSubmitApplication = () => {
    setHasAttemptedSubmit(true);

    form.handleSubmit(async () => {
      const uid = user?.uid;
      const draft = useApplicantStore.getState().applicantDraft;

      if (!uid || !draft) {
        setSubmitError("Unable to submit. Please refresh and try again.");
        return;
      }

      if (applicationsOpen?.[activeHackathon] === false) {
        setSubmitError("Applications are are now closed.");
        return;
      }

      setSubmitting(true);
      setSubmitError(null);

      try {
        const submittedDraft = await submitApplicantDraft(dbCollectionName, uid, draft);

        useApplicantStore.setState({
          applicantDraft: submittedDraft,
          dirty: false,
        });

        const sendConfirmationEmail = httpsCallable(functions, "sendConfirmationEmail");
        await sendConfirmationEmail({
          email: submittedDraft.basicInfo?.email,
          timestamp: `${new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })} PST`,
          hackathonName: displayNameFull,
        });

        fireSideCannons(confettiColors);

        await router.navigate({
          to: "/$activeHackathon/application",
          params: { activeHackathon },
        });
      } catch (error) {
        console.error("Failed to submit application", error);
        setSubmitError("Failed to submit application. Please try again.");
      } finally {
        setSubmitting(false);
      }
    })();
  };

  return (
    <>
      <ScrollFade className="flex min-h-0 flex-1 flex-col gap-10">
        <h1 className="font-semibold text-2xl">Review your application</h1>

        <div className="space-y-20">
          <BasicInfoSection applicantDraft={applicantDraft} />
          <SkillsSection applicantDraft={applicantDraft} />
          <QuestionnaireSection applicantDraft={applicantDraft} />
          <TermsSection />
        </div>
      </ScrollFade>

      {hasValidationErrors && (
        <p className="text-sm text-text-error">
          One or more answers are still missing. Use the back button to revisit each section.
        </p>
      )}

      {submitError && <p className="text-sm text-text-error">{submitError}</p>}

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
    </>
  );
}
