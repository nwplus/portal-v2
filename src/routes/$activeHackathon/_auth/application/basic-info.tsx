import { QuestionField } from "@/components/features/application/question-field";
import { Button } from "@/components/ui/button";
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { useHackathon } from "@/hooks/use-hackathon";
import type { ApplicationFormValues } from "@/lib/application/types";
import { useApplicationQuestionStore } from "@/lib/stores/application-question-store";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { useFormContext } from "react-hook-form";

export const Route = createFileRoute("/$activeHackathon/_auth/application/basic-info")({
  component: RouteComponent,
});

function RouteComponent() {
  const { activeHackathon } = useHackathon();
  const questions = useApplicationQuestionStore((state) => state.basicInfoQuestions);
  const form = useFormContext<ApplicationFormValues>();
  const router = useRouter();

  if (!questions.length) {
    return <div>No basic info questions yet.</div>;
  }

  const handleNext = async () => {
    const isValid = await form.trigger("basicInfo");
    if (!isValid) {
      // Scroll to the first invalid field's container (includes label)
      const firstInvalid = document.querySelector('[aria-invalid="true"]');
      const fieldContainer = firstInvalid?.closest('[data-slot="field"]');
      (fieldContainer ?? firstInvalid)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    await router.navigate({
      to: "/$activeHackathon/application/skills",
      params: { activeHackathon },
    });
  };

  return (
    <section className="space-y-4">
      <h1 className="font-semibold text-2xl">Basic Info</h1>
      <FieldSet className="space-y-3">
        <FieldLegend variant="label" className="sr-only">
          Basic Info questions
        </FieldLegend>
        <FieldGroup>
          {questions.map((question) => (
            <QuestionField key={question._id} section="BasicInfo" question={question} />
          ))}
        </FieldGroup>
      </FieldSet>

      <div className="flex gap-2 pt-2">
        <Button variant="secondary" asChild>
          <Link to="/$activeHackathon/application" params={{ activeHackathon }}>
            ← Back
          </Link>
        </Button>
        <Button variant="primary" type="button" onClick={handleNext}>
          Next →
        </Button>
      </div>
    </section>
  );
}
