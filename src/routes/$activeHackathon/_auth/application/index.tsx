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
  const hackathonStart = usePortalStore((state) => state.hackathonStart);
  const hackathonStartDate = hackathonStart ? new Date(hackathonStart[activeHackathon]) : null;
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
    <div className="flex h-full flex-col">
      <Navbar variant="index" />
      <div className="scrollbar-hidden flex min-h-0 flex-1 flex-col overflow-y-auto px-6 md:grid md:grid-cols-2 md:gap-0 md:overflow-visible md:px-0 md:pb-[15vh]">
        <div className="flex w-full items-center justify-start md:w-[90%] md:justify-center">
          <div className="flex flex-col items-start gap-4 md:gap-10">
            <div className="flex aspect-square size-7 items-center justify-center rounded-lg md:size-16">
              <HackathonIcon />
            </div>
            <div className="flex flex-col items-start gap-0 md:gap-2">
              <h1 className="font-medium text-3xl md:text-6xl">Welcome to</h1>
              <h1 className="font-medium text-3xl md:text-6xl">{displayNameFull}</h1>
            </div>
            <div className="flex flex-col items-start gap-2">
              <p className="font-regular text-sm md:text-xl">
                🗓️ {`${hackathonWeekend?.[activeHackathon]}, ${hackathonStartDate?.getFullYear()}`}{" "}
              </p>
              <p className="font-regular text-sm md:text-xl">📍 {location?.[activeHackathon]} </p>
            </div>

            <div className="flex flex-col items-start gap-3">
              <div className="flex flex-row flex-wrap gap-3 md:gap-6">
                <Tag variant="active" className="gap-2 pr-6 pl-5 text-xs md:text-base">
                  {applicationStatus === "inProgress" && (
                    <>
                      <PencilLine className="size-3 md:size-5" strokeWidth={2} />
                      {hasStartedApplication
                        ? "Application in progress"
                        : "Application not started"}
                    </>
                  )}
                  {applicationStatus === "applied" && (
                    <>
                      <Check className="size-3 md:size-5" strokeWidth={2} />
                      Application submitted
                    </>
                  )}

                  {(applicationStatus === "acceptedNoResponseYet" ||
                    applicationStatus === "acceptedAndAttending") && (
                    <>
                      <PartyPopper className="size-3 md:size-5" strokeWidth={2} />
                      Application accepted
                    </>
                  )}
                  {applicationStatus === "acceptedUnRSVP" && "Application withdrawn"}
                  {applicationStatus === "waitlisted" && "Application waitlisted"}
                  {applicationStatus === "rejected" && "Application rejected"}
                </Tag>
                {applicationStatus === "acceptedNoResponseYet" && (
                  <Tag variant="active" className="gap-2 pr-6 pl-5">
                    <Clock className="size-3 md:size-5" strokeWidth={2} />
                    Awaiting RSVP
                  </Tag>
                )}
                {applicationStatus === "acceptedAndAttending" && (
                  <Tag variant="active" className="gap-2 pr-6 pl-5">
                    <Check className="size-3 md:size-5" strokeWidth={2} />
                    RSVP'd
                  </Tag>
                )}
              </div>
              {applicationStatus === "inProgress" && (
                <p className="font-regular text-text-secondary text-xs md:text-sm">
                  due {applicationDeadline?.[activeHackathon]}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col items-center justify-center gap-8 py-8 md:max-w-[80%] md:items-start md:gap-12 md:py-0">
          {(applicationStatus === "inProgress" || applicationStatus === "applied") && (
            <div className="flex flex-col items-start gap-4 rounded-2xl border border-border-subtle p-5 text-sm [background:var(--background-translucent-card)] md:gap-6 md:rounded-none md:border-0 md:p-0 md:text-base md:[background:none]">
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
              <p className="font-cursive text-2xl md:text-4xl">- the {displayNameShort} team</p>
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
    </div>
  );
}
