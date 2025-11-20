import { TermsCheckbox } from "@/components/features/application/terms-checkbox";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { useHackathon } from "@/hooks/use-hackathon";
import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import { formatAnswerForReview } from "@/lib/application/review-format";
import type { ApplicationFormValues } from "@/lib/application/types";
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

  const handleSubmitApplication = form.handleSubmit(async () => {
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
        to: "/$activeHackathon/application/rsvp",
        params: { activeHackathon },
      });
    } catch (error) {
      console.error("Failed to persist submitted application", error);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <section className="space-y-6">
      <h1 className="font-semibold text-2xl">Review</h1>
      <p className="text-sm text-text-secondary">
        Please review your answers and agree to the terms and conditions before submitting.
      </p>

      <div className="space-y-6">
        <FieldSet className="space-y-3">
          <FieldTitle>Basic Info</FieldTitle>
          {basicInfoQuestions.map((question) => {
            if (question.type === "Full Legal Name") {
              // We show legal first/last/preferred name separately below.
              return null;
            }
            const value = formatAnswerForReview("BasicInfo", question, applicantDraft);
            return (
              <Field key={question._id}>
                <FieldLabel>{question.title ?? "Untitled"}</FieldLabel>
                <FieldDescription>{question.description}</FieldDescription>
                <FieldContent>
                  <p className="text-sm text-text-secondary">{value}</p>
                </FieldContent>
              </Field>
            );
          })}

          {/* Explicit full legal name fields */}
          <Field>
            <FieldLabel>Legal first name</FieldLabel>
            <FieldContent>
              <p className="text-sm text-text-secondary">
                {applicantDraft?.basicInfo?.legalFirstName?.trim() || "Not answered"}
              </p>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Legal last name</FieldLabel>
            <FieldContent>
              <p className="text-sm text-text-secondary">
                {applicantDraft?.basicInfo?.legalLastName?.trim() || "Not answered"}
              </p>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Preferred name</FieldLabel>
            <FieldContent>
              <p className="text-sm text-text-secondary">
                {applicantDraft?.basicInfo?.preferredName?.trim() || "Not answered"}
              </p>
            </FieldContent>
          </Field>
        </FieldSet>

        <FieldSet className="space-y-3">
          <FieldTitle>Skills</FieldTitle>
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

                // We no longer encode the original file name in the storage path,
                // so avoid showing internal ids; just indicate that a resume exists.
                return "Uploaded";
              };

              const items: Array<{ key: string; label: string; value: string }> = [
                { key: "resume", label: "Resume", value: formatResume(skills.resume) },
                { key: "linkedin", label: "LinkedIn", value: formatLink(skills.linkedin) },
                { key: "github", label: "GitHub", value: formatLink(skills.github) },
                { key: "portfolio", label: "Portfolio", value: formatLink(skills.portfolio) },
              ];

              return (
                <Fragment key={question._id}>
                  {items.map((item) => (
                    <Field key={item.key}>
                      <FieldLabel>{item.label}</FieldLabel>
                      <FieldContent>
                        <p className="text-sm text-text-secondary">{item.value}</p>
                      </FieldContent>
                    </Field>
                  ))}
                </Fragment>
              );
            }

            const value = formatAnswerForReview("Skills", question, applicantDraft);
            return (
              <Field key={question._id}>
                <FieldLabel>{question.title ?? "Untitled"}</FieldLabel>
                <FieldDescription>{question.description}</FieldDescription>
                <FieldContent>
                  <p className="text-sm text-text-secondary">{value}</p>
                </FieldContent>
              </Field>
            );
          })}
        </FieldSet>

        <FieldSet className="space-y-3">
          <FieldTitle>Questionnaire</FieldTitle>
          {questionnaireQuestions.map((question) => {
            const value = formatAnswerForReview("Questionnaire", question, applicantDraft);
            return (
              <Field key={question._id}>
                <FieldLabel>{question.title ?? "Untitled"}</FieldLabel>
                <FieldDescription>{question.description}</FieldDescription>
                <FieldContent>
                  <p className="text-sm text-text-secondary">{value}</p>
                </FieldContent>
              </Field>
            );
          })}
        </FieldSet>

        {/* Terms and Conditions */}
        <FieldSet className="space-y-3">
          <FieldTitle>Terms and conditions</FieldTitle>

          <TermsCheckbox
            name="termsAndConditions.MLHCodeOfConduct"
            label="I have read and agree to the MLH Code of Conduct."
          />
          <TermsCheckbox
            name="termsAndConditions.MLHPrivacyPolicy"
            label="I authorize MLH to share my application/registration information with MLH for event administration, ranking, and MLH administration."
          />
          <TermsCheckbox
            name="termsAndConditions.nwPlusPrivacyPolicy"
            label="I agree to the nwPlus Privacy Policy."
          />
          <TermsCheckbox
            name="termsAndConditions.shareWithnwPlus"
            label="I agree that my application data may be used internally by nwPlus."
          />
          <TermsCheckbox
            name="termsAndConditions.shareWithSponsors"
            label="I agree that my application data may be shared with sponsors."
            optional
          />
          <TermsCheckbox
            name="termsAndConditions.MLHEmailSubscription"
            label="I would like to receive emails from MLH about future events."
            optional
          />
        </FieldSet>
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="secondary" asChild>
          <Link to="/$activeHackathon/application/questionnaire" params={{ activeHackathon }}>
            ← Back
          </Link>
        </Button>
        <Button variant="primary" onClick={handleSubmitApplication} disabled={submitting}>
          {submitting ? "Submitting…" : "Submit application"}
        </Button>
      </div>
    </section>
  );
}
