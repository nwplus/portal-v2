import { useHackathon } from "@/hooks/use-hackathon";
import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import type { ApplicationStatus } from "@/lib/firebase/types/applicants";
import { useApplicantStore } from "@/lib/stores/applicant-store";
import { useApplicationQuestionStore } from "@/lib/stores/application-question-store";
import { usePortalStore } from "@/lib/stores/portal-store";
import ReactMarkdown from "react-markdown";

type BlurbProps = {
  name: string;
  displayNameShort?: string;
  displayNameFull?: string;
  applicationDeadline?: string;
  hackathonWeekend?: string;
  rsvpBy?: string;
  offWaitlistNotify?: string;
  sendAcceptancesBy?: string;
  waitlistSignupDeadline?: string;
};

type InternalStatus = "inProgress" | "gradinginprog" | "scored" | "completed";

const statusBlurbs: Record<
  Exclude<ApplicationStatus, InternalStatus> | "closed",
  (props: BlurbProps) => string
> = {
  applied: ({ name, displayNameShort, sendAcceptancesBy }: BlurbProps) =>
    [
      `Hi ${name},`,
      `Thank you for applying to ${displayNameShort}!`,
      `We will send out all acceptances by ${sendAcceptancesBy}. In the meantime, get connected with our community of hackers on [Instagram](https://www.instagram.com/nwplusubc), [Facebook](https://www.facebook.com/nwplusubc), and [Medium](https://medium.com/nwplusubc) to stay up to date with the latest news on sponsors, prizes and workshops!`,
    ].join("\n\n"),

  rejected: ({ name, displayNameFull }: BlurbProps) =>
    [
      `Hi ${name},`,
      `We are sorry to inform you that we won't be able to give you a spot at ${displayNameFull}. We had a lot of amazing applicants this year, and we are very grateful to have gotten yours.`,
      "We do hope to see your application next year and encourage to continue building your portfolio in the meantime. Please visit [nwplus.io](https://nwplus.io) to learn about more events and other ways to engage with the technology community.",
    ].join("\n\n"),

  waitlisted: ({ name, displayNameFull, offWaitlistNotify }: BlurbProps) =>
    [
      `Hi ${name},`,
      `We would love to see you at ${displayNameFull} this year; however, at the moment, we cannot confirm a spot for you. You have been put on our waitlist and will be notified by ${offWaitlistNotify} if we have a spot for you, so please check your email then!`,
    ].join("\n\n"),

  pendingWaitlist: ({ name, displayNameFull, waitlistSignupDeadline }: BlurbProps) =>
    [
      `Hi ${name},`,
      `We're sorry that we didn't receive an RSVP from you by the provided deadline. If you are still interested in joining us at ${displayNameFull}, please check your email for instructions on how to join the waitlist by ${waitlistSignupDeadline}.`,
    ].join("\n\n"),

  closed: ({ displayNameFull }: BlurbProps) =>
    [
      "Hi there,",
      `We are no longer accepting applications for ${displayNameFull}, but we do hope to see you at our future events! `,
      "Visit our website at [nwplus.io](https://nwplus.io) or follow us on social media to learn about our events and other ways to engage with the technology community!",
    ].join("\n\n"),

  acceptedNoResponseYet: ({ name, displayNameFull, hackathonWeekend, rsvpBy }: BlurbProps) =>
    [
      `Hi ${name}!`,
      `Congratulations! We loved the passion and drive we saw in your application, and we'd love for you to join us at ${displayNameFull} over the weekend of ${hackathonWeekend}!`,
      `Please RSVP before ${rsvpBy} to confirm your spot.`,
    ].join("\n\n"),

  acceptedAndAttending: ({ name, displayNameFull, hackathonWeekend }: BlurbProps) =>
    [
      `Hi ${name}!`,
      `Thank you for RSVPing — you're all set! See you at ${displayNameFull} over the weekend of ${hackathonWeekend}!`,
    ].join("\n\n"),

  acceptedUnRSVP: ({ name, displayNameFull }: BlurbProps) =>
    [
      `Hi ${name}!`,
      `We're sorry you won't be attending ${displayNameFull}. We do hope to see you at our future events, visit our website at [nwplus.io](https://nwplus.io) or follow us on social media to learn about our events and other ways to engage with the technology community!`,
    ].join("\n\n"),
} as const;

export function StatusBlurb() {
  const { activeHackathon } = useHackathon();
  const { displayNameFull, displayNameShort } = useHackathonInfo();
  const hackathonWeekend = usePortalStore((state) => state.hackathonWeekend);
  const applicationDeadline = usePortalStore((state) => state.applicationDeadline);
  const applicationsOpen = usePortalStore((state) => state.applicationsOpen);
  const rsvpBy = usePortalStore((state) => state.rsvpBy);
  const sendAcceptancesBy = usePortalStore((state) => state.sendAcceptancesBy);
  const offWaitlistNotify = usePortalStore((state) => state.offWaitlistNotify);
  const waitlistSignupDeadline = usePortalStore((state) => state.waitlistSignupDeadline);
  const welcome = useApplicationQuestionStore((s) => s.welcome);
  const applicationStatus = useApplicantStore(
    (state) => state.applicantDraft?.status.applicationStatus,
  );
  const name = useApplicantStore(
    (state) =>
      state.applicantDraft?.basicInfo?.preferredName ??
      state.applicantDraft?.basicInfo?.legalFirstName ??
      "there",
  );

  const isApplicationsOpen = applicationsOpen?.[activeHackathon] ?? false;

  const getStatusContent = () => {
    const blurbProps = {
      name,
      displayNameShort,
      displayNameFull,
      applicationDeadline: applicationDeadline?.[activeHackathon],
      hackathonWeekend: hackathonWeekend?.[activeHackathon],
      sendAcceptancesBy: sendAcceptancesBy?.[activeHackathon],
      rsvpBy: rsvpBy?.[activeHackathon],
      offWaitlistNotify: offWaitlistNotify?.[activeHackathon],
      waitlistSignupDeadline: waitlistSignupDeadline?.[activeHackathon],
    };

    if (applicationStatus === "inProgress") {
      if (isApplicationsOpen) {
        return welcome?.content ?? "";
      }
      return statusBlurbs.closed(blurbProps);
    }

    if (
      applicationStatus === "gradinginprog" ||
      applicationStatus === "scored" ||
      applicationStatus === "completed"
    ) {
      return statusBlurbs.applied(blurbProps);
    }

    if (applicationStatus && applicationStatus in statusBlurbs) {
      return statusBlurbs[applicationStatus as keyof typeof statusBlurbs](blurbProps);
    }

    return welcome?.content ?? "";
  };

  return (
    <>
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
        {getStatusContent()}
      </ReactMarkdown>
      <p className="font-cursive text-2xl md:text-4xl">- the {displayNameShort} team</p>
    </>
  );
}
