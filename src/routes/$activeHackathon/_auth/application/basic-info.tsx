import { useHackathon } from "@/hooks/use-hackathon";
import { useApplicantStore } from "@/lib/stores/applicant-store";
import { useApplicationQuestionStore } from "@/lib/stores/application-question-store";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/_auth/application/basic-info")({
  component: RouteComponent,
});

function RouteComponent() {
  const { activeHackathon } = useHackathon();
  const questions = useApplicationQuestionStore((s) => s.basicInfoQuestions);
  const applicantDraft = useApplicantStore((s) => s.applicantDraft);

  if (!questions.length) {
    return <div>No basic info questions yet.</div>;
  }

  return (
    <section className="space-y-4">
      <h1 className="font-semibold text-2xl">Basic Info</h1>
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
          <p>Legal Last Name: {applicantDraft?.basicInfo?.legalLastName}</p>
          <p>Legal First Name: {applicantDraft?.basicInfo?.legalFirstName}</p>
          <p>Preferred Name: {applicantDraft?.basicInfo?.preferredName}</p>
        </div>
        <div className="flex flex-col gap-2">
          <p>Phone Number: {applicantDraft?.basicInfo?.phoneNumber}</p>
          <p>Email: {applicantDraft?.basicInfo?.email}</p>
          <p>Gender: {JSON.stringify(applicantDraft?.basicInfo?.gender)}</p>
          <p>Graduation: {applicantDraft?.basicInfo?.graduation}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p>Country of Residence: {applicantDraft?.basicInfo?.countryOfResidence}</p>
        <p>Education Level: {applicantDraft?.basicInfo?.educationLevel}</p>
        <p>Major: {JSON.stringify(applicantDraft?.basicInfo?.major)}</p>
        <p>School: {applicantDraft?.basicInfo?.school}</p>
      </div>
      <div className="flex flex-col gap-2">
        <p>Cultural Background: {JSON.stringify(applicantDraft?.basicInfo?.culturalBackground)}</p>
        <p>Dietary Restriction: {JSON.stringify(applicantDraft?.basicInfo?.dietaryRestriction)}</p>
      </div>

      <div className="flex gap-2 pt-2">
        <Link to="/$activeHackathon/application" params={{ activeHackathon }}>
          ← Back
        </Link>
        <Link to="/$activeHackathon/application/skills" params={{ activeHackathon }}>
          Next →
        </Link>
      </div>
    </section>
  );
}
