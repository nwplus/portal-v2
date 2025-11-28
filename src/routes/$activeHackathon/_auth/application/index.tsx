import { Button } from "@/components/ui/button";
import { useHackathon } from "@/hooks/use-hackathon";
import { useApplicantStore } from "@/lib/stores/applicant-store";
import { useApplicationQuestionStore } from "@/lib/stores/application-question-store";
import { Link, createFileRoute } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/$activeHackathon/_auth/application/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { activeHackathon } = useHackathon();
  const welcome = useApplicationQuestionStore((s) => s.welcome);
  const applicationStatus = useApplicantStore(
    (state) => state.applicantDraft?.status.applicationStatus,
  );

  if (!welcome) {
    return null;
  }

  return (
    <div className="grid h-full grid-cols-2 items-center">
      <div>left side</div>
      <div className="flex flex-col items-start gap-12">
        {applicationStatus === "applied" && <div>Application submitted</div>}

        {applicationStatus === "inProgress" && (
          <>
            <h1 className="font-semibold text-2xl">{welcome.title ?? "Welcome"}</h1>
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <Link to={href} target="_blank" rel="noopener noreferrer" className="underline">
                    {children}
                  </Link>
                ),
              }}
            >
              {welcome.content}
            </ReactMarkdown>

            <Button asChild>
              <Link to="/$activeHackathon/application/basic-info" params={{ activeHackathon }}>
                Get Started
              </Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
