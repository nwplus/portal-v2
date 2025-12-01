import { Navbar } from "@/components/features/application/navbar";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { useHackathon } from "@/hooks/use-hackathon";
import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import { useApplicantStore } from "@/lib/stores/applicant-store";
import { useApplicationQuestionStore } from "@/lib/stores/application-question-store";
import { usePortalStore } from "@/lib/stores/portal-store";
import { getColouredHackathonIcon } from "@/lib/utils";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Check, Clock, PartyPopper, PencilLine } from "lucide-react";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/$activeHackathon/_auth/application/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { activeHackathon } = useHackathon();
  const { displayNameFull, displayNameShort } = useHackathonInfo();
  const hackathonWeekend = usePortalStore((state) => state.hackathonWeekend);
  const location = usePortalStore((state) => state.location);
  const applicationDeadline = usePortalStore((state) => state.applicationDeadline);
  const welcome = useApplicationQuestionStore((s) => s.welcome);
  const applicationStatus = useApplicantStore(
    (state) => state.applicantDraft?.status.applicationStatus,
  );
  // since we don't have a status for new applicants
  const hasStartedApplication = useApplicantStore((state) => {
    const basicInfo = state.applicantDraft?.basicInfo;
    return !!(basicInfo?.preferredName || basicInfo?.phoneNumber);
  });

  const HackathonIcon = getColouredHackathonIcon(activeHackathon);

  if (!welcome) {
    return null;
  }

  return (
    <>
      <Navbar variant="index" />
      <div className="grid h-full grid-cols-2">
        <div className="flex w-[90%] justify-center pt-[20vh]">
          <div className="flex flex-col items-start gap-10">
            <div className="flex aspect-square size-16 items-center justify-center rounded-lg">
              <HackathonIcon />
            </div>
            <div className="flex flex-col items-start gap-2">
              <h1 className="font-medium text-6xl">Welcome to</h1>
              <h1 className="font-medium text-6xl">{displayNameFull}</h1>
            </div>
            <div className="flex flex-col items-start gap-2">
              <h1 className="font-regular text-xl">🗓️ {hackathonWeekend?.[activeHackathon]} </h1>
              <h1 className="font-regular text-xl">📍 {location?.[activeHackathon]} </h1>
            </div>

            <div className="flex flex-col items-start gap-3">
              <div className="flex flex-row gap-6">
                <Tag variant="active" className="gap-2 pr-6 pl-5">
                  {applicationStatus === "inProgress" && (
                    <>
                      <PencilLine className="size-5" strokeWidth={2} />
                      {hasStartedApplication
                        ? "Application in progress"
                        : "Application not started"}
                    </>
                  )}
                  {applicationStatus === "applied" && (
                    <>
                      <Check className="size-5" strokeWidth={2} />
                      Application submitted
                    </>
                  )}

                  {(applicationStatus === "acceptedNoResponseYet" ||
                    applicationStatus === "acceptedAndAttending") && (
                    <>
                      <PartyPopper className="size-5" strokeWidth={2} />
                      Application accepted
                    </>
                  )}
                  {applicationStatus === "acceptedUnRSVP" && "Application withdrawn"}
                  {applicationStatus === "waitlisted" && "Application waitlisted"}
                  {applicationStatus === "rejected" && "Application rejected"}
                </Tag>
                {applicationStatus === "acceptedNoResponseYet" && (
                  <Tag variant="active" className="gap-2 pr-6 pl-5">
                    <Clock className="size-5" strokeWidth={2} />
                    Awaiting RSVP
                  </Tag>
                )}
                {applicationStatus === "acceptedAndAttending" && (
                  <Tag variant="active" className="gap-2 pr-6 pl-5">
                    <Check className="size-5" strokeWidth={2} />
                    RSVP'd
                  </Tag>
                )}
              </div>
              {applicationStatus === "inProgress" && (
                <p className="font-regular text-sm">due {applicationDeadline?.[activeHackathon]}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start justify-center gap-12">
          {(applicationStatus === "inProgress" || applicationStatus === "applied") && (
            <div className="flex flex-col items-start gap-6">
              <ReactMarkdown
                components={{
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4 hover:text-text-primary/80"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {welcome.content}
              </ReactMarkdown>
              <p className="font-cursive text-4xl">- the {displayNameShort} team</p>
            </div>
          )}
          {applicationStatus === "inProgress" && (
            <Button variant="primary" asChild>
              <Link to="/$activeHackathon/application/basic-info" params={{ activeHackathon }}>
                {hasStartedApplication ? "Continue application →" : "Get started →"}
              </Link>
            </Button>
          )}
          {applicationStatus === "acceptedNoResponseYet" && (
            <Button variant="primary" asChild>
              <Link to="/$activeHackathon/application/rsvp" params={{ activeHackathon }}>
                RSVP
              </Link>
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
