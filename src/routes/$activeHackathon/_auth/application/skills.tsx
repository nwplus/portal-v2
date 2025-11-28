import { QuestionField } from "@/components/features/application/question-field";
import { Button } from "@/components/ui/button";
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { ScrollFade } from "@/components/ui/scroll-fade";
import { useHackathon } from "@/hooks/use-hackathon";
import type { ApplicationFormValues } from "@/lib/application/types";
import { useApplicationQuestionStore } from "@/lib/stores/application-question-store";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { useFormContext } from "react-hook-form";

export const Route = createFileRoute("/$activeHackathon/_auth/application/skills")({
  component: RouteComponent,
});

function RouteComponent() {
  const { activeHackathon } = useHackathon();
  const questions = useApplicationQuestionStore((state) => state.skillsQuestions);
  const form = useFormContext<ApplicationFormValues>();
  const router = useRouter();

  if (!questions.length) {
    return <div>No skills questions yet.</div>;
  }

  const handleNext = async () => {
    const isValid = await form.trigger("skills");
    if (!isValid) {
      const firstInvalid = document.querySelector('[aria-invalid="true"]');
      const fieldContainer = firstInvalid?.closest('[data-slot="field"]');
      (fieldContainer ?? firstInvalid)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    await router.navigate({
      to: "/$activeHackathon/application/questionnaire",
      params: { activeHackathon },
    });
  };

  return (
    <div className="flex h-full gap-12">
      <div className="flex flex-[3] flex-col gap-6 p-4">
        <ScrollFade className="flex flex-col gap-6">
          <h1 className="font-medium text-lg">👀 Academic background</h1>
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
      </div>
      <div className="flex min-h-0 flex-[2] items-center justify-center"> right side </div>
    </div>
  );
}
