import { useHackathon } from "@/hooks/use-hackathon";
import { useApplicantStore } from "@/lib/stores/applicant-store";
import { useApplicationQuestionStore } from "@/lib/stores/application-question-store";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/_auth/application/skills")({
  component: RouteComponent,
});

function RouteComponent() {
  const { activeHackathon } = useHackathon();
  const questions = useApplicationQuestionStore((s) => s.skillsQuestions);
  const applicantDraft = useApplicantStore((s) => s.applicantDraft);

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
              <div className="text-muted-foreground text-sm">{q.description}</div>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p>Github: {applicantDraft?.skills?.github}</p>
          <p>Linkedin: {applicantDraft?.skills?.linkedin}</p>
          <p>Portfolio: {applicantDraft?.skills?.portfolio}</p>
          <p>Resume: {applicantDraft?.skills?.resume}</p>
          <p>Num Hackathons Attended: {applicantDraft?.skills?.numHackathonsAttended}</p>
          <p>Contribution Role: {JSON.stringify(applicantDraft?.skills?.contributionRole)}</p>
          <p>Long Answers 1: {applicantDraft?.skills?.longAnswers1}</p>
          <p>Long Answers 2: {applicantDraft?.skills?.longAnswers2}</p>
          <p>Long Answers 3: {applicantDraft?.skills?.longAnswers3}</p>
          <p>Long Answers 4: {applicantDraft?.skills?.longAnswers4}</p>
          <p>Long Answers 5: {applicantDraft?.skills?.longAnswers5}</p>
        </div>
      </div>

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
