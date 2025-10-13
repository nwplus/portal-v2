import { useHackathon } from "@/hooks/use-hackathon";
import { useApplicationQuestionStore } from "@/lib/stores/application-question-store";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/_auth/application/review")({
  component: RouteComponent,
});

function RouteComponent() {
  const { activeHackathon } = useHackathon();
  const basicInfoQuestions = useApplicationQuestionStore((s) => s.basicInfoQuestions);
  const skillsQuestions = useApplicationQuestionStore((s) => s.skillsQuestions);
  const questionnaireQuestions = useApplicationQuestionStore((s) => s.questionnaireQuestions);

  return (
    <div className="space-y-4">
      <h1 className="font-semibold text-2xl">Review</h1>
      <p>Final review screen.</p>
      <div className="pt-2">
        <p>Basic Info</p>
        {basicInfoQuestions.map((q) => (
          <p key={q._id}>{q.title}</p>
        ))}

        <p>Skills</p>
        {skillsQuestions.map((q) => (
          <p key={q._id}>{q.title}</p>
        ))}

        <p>Questionnaire</p>
        {questionnaireQuestions.map((q) => (
          <p key={q._id}>{q.title}</p>
        ))}
        <Link to="/$activeHackathon/application/questionnaire" params={{ activeHackathon }}>
          ← Back
        </Link>
      </div>
    </div>
  );
}
