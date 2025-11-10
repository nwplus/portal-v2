import { useHackathon } from "@/hooks/use-hackathon";
import { useApplicationQuestionStore } from "@/lib/stores/application-question-store";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/_auth/application/skills")({
  component: RouteComponent,
});

function RouteComponent() {
  const { activeHackathon } = useHackathon();
  const questions = useApplicationQuestionStore((s) => s.skillsQuestions);

  if (!questions.length) {
    return <div>No skills questions yet.</div>;
  }

  return (
    <section className="space-y-4">
      <h1 className="font-semibold text-2xl">Skills</h1>
      <ul className="space-y-3">
        {questions.map((q) => (
          <li key={q._id} className="rounded-md border p-3">
            <div className="font-medium">{q.title ?? "Untitled"}</div>
            {q.description ? (
              <div className="text-sm text-text-secondary">{q.description}</div>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="flex gap-2 pt-2">
        <Link to="/$activeHackathon/application/basic-info" params={{ activeHackathon }}>
          ← Back
        </Link>
        <Link to="/$activeHackathon/application/questionnaire" params={{ activeHackathon }}>
          Next →
        </Link>
      </div>
    </section>
  );
}
