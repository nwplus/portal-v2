import { useHackathon } from "@/hooks/use-hackathon";
import { useApplicationQuestionStore } from "@/lib/stores/application-question-store";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/_auth/application/questionnaire")({
  component: RouteComponent,
});

function RouteComponent() {
  const { activeHackathon } = useHackathon();
  const questions = useApplicationQuestionStore((s) => s.questionnaireQuestions);

  if (!questions.length) {
    return <div>No questionnaire questions yet.</div>;
  }

  return (
    <section className="space-y-4">
      <h1 className="font-semibold text-2xl">Questionnaire</h1>
      <ul className="space-y-3">
        {questions.map((q) => (
          <li key={q._id} className="rounded-md border p-3">
            <div className="font-medium">{q.title ?? "Untitled"}</div>
            {q.description ? (
              <div className="text-muted-foreground text-sm">{q.description}</div>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="flex gap-2 pt-2">
        <Link to="/$activeHackathon/application/skills" params={{ activeHackathon }}>
          ← Back
        </Link>
        <Link to="/$activeHackathon/application/review" params={{ activeHackathon }}>
          Next →
        </Link>
      </div>
    </section>
  );
}
