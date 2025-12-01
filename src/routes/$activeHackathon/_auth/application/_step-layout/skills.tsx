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

export const Route = createFileRoute("/$activeHackathon/_auth/application/_step-layout/skills")({
  component: RouteComponent,
});

function RouteComponent() {
  const { activeHackathon } = useHackathon();
  const { dbCollectionName } = useHackathonInfo();
  const questions = useApplicationQuestionStore((state) => state.skillsQuestions);
  const form = useFormContext<ApplicationFormValues>();
  const router = useRouter();

  if (!questions.length) {
    return null;
  }

  const handleNext = async () => {
    const isValid = await form.trigger("skills");
    if (!isValid) {
      const firstInvalid = document.querySelector('[aria-invalid="true"]');
      const fieldContainer = firstInvalid?.closest('[data-slot="field"]');
      (fieldContainer ?? firstInvalid)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    await saveApplicantDraft(dbCollectionName);

    await router.navigate({
      to: "/$activeHackathon/application/questionnaire",
      params: { activeHackathon },
    });
  };

  return (
    <>
      <ScrollFade className="flex flex-col gap-10">
        <h1 className="font-semibold text-2xl">👀 Academic background</h1>
        <FieldSet>
          <FieldGroup>
            {questions.map((question) => (
              <QuestionField key={question._id} section="Skills" question={question} />
            ))}
          </FieldGroup>
        </FieldSet>
      </ScrollFade>
      <div className="flex justify-between">
        <Button variant="secondary" asChild>
          <Link to="/$activeHackathon/application/basic-info" params={{ activeHackathon }}>
            ← Back
          </Link>
        </Button>
        <Button variant="primary" type="button" onClick={handleNext}>
          Next →
        </Button>
      </div>
    </>
  );
}
