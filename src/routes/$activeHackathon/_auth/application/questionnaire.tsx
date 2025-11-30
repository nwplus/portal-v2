import { ProgressBar } from "@/components/features/application/progress-bar";
import { QuestionField } from "@/components/features/application/question-field";
import { Button } from "@/components/ui/button";
import { FieldGroup, FieldSet } from "@/components/ui/field";
import { ScrollFade } from "@/components/ui/scroll-fade";
import { useHackathon } from "@/hooks/use-hackathon";
import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import type { ApplicationFormValues } from "@/lib/application/types";
import { useApplicationQuestionStore } from "@/lib/stores/application-question-store";
import { saveApplicantDraft } from "@/services/applicants";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { useFormContext } from "react-hook-form";

export const Route = createFileRoute("/$activeHackathon/_auth/application/questionnaire")({
  component: RouteComponent,
});

function RouteComponent() {
  const { activeHackathon } = useHackathon();
  const { dbCollectionName } = useHackathonInfo();
  const questions = useApplicationQuestionStore((state) => state.questionnaireQuestions);
  const form = useFormContext<ApplicationFormValues>();
  const router = useRouter();

  if (!questions.length) {
    return <div>No questionnaire questions yet.</div>;
  }

  const handleNext = async () => {
    const isValid = await form.trigger("questionnaire");
    if (!isValid) {
      const firstInvalid = document.querySelector('[aria-invalid="true"]');
      const fieldContainer = firstInvalid?.closest('[data-slot="field"]');
      (fieldContainer ?? firstInvalid)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    await saveApplicantDraft(dbCollectionName);

    await router.navigate({
      to: "/$activeHackathon/application/review",
      params: { activeHackathon },
    });
  };

  return (
    <div className="flex h-full">
      <div className="flex flex-1 gap-16 px-6 py-2">
        <ProgressBar step={3} />
        <div className="flex min-h-0 flex-1 flex-col justify-between gap-6 overflow-hidden">
          <ScrollFade className="flex flex-col gap-6">
            <h1 className="font-semibold text-2xl">📝 Questionnaire</h1>
            <FieldSet>
              <FieldGroup>
                {questions.map((question) => (
                  <QuestionField key={question._id} section="Questionnaire" question={question} />
                ))}
              </FieldGroup>
            </FieldSet>
          </ScrollFade>
          <div className="flex justify-between">
            <Button variant="secondary" asChild>
              <Link to="/$activeHackathon/application/skills" params={{ activeHackathon }}>
                ← Back
              </Link>
            </Button>
            <Button variant="primary" type="button" onClick={handleNext}>
              Next →
            </Button>
          </div>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center"> right side </div>
    </div>
  );
}
