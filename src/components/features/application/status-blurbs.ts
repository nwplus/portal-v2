import type { ApplicationStatus } from "@/lib/firebase/types/applicants";

type BlurbProps = {
  preferredName: string;
  displayNameShort?: string;
  displayNameFull?: string;
  applicationDeadline?: string;
  hackathonWeekend?: string;
  rsvpBy?: string;
  offWaitlistNotify?: string;
};

type InternalStatus = "inProgress" | "gradinginprog" | "scored" | "completed";

export const statusBlurbs: Record<
  Exclude<ApplicationStatus, InternalStatus> | "closed",
  (props: BlurbProps) => string
> = {
  applied: ({ preferredName, displayNameShort, applicationDeadline }: BlurbProps) =>
    [
      `Hi ${preferredName},`,
      `Thank you for applying to ${displayNameShort}!`,
      `We will send out all acceptances by ${applicationDeadline}. In the meantime, get connected with our community of hackers on [Instagram](https://www.instagram.com/nwplusubc), [Facebook](https://www.facebook.com/nwplusubc), and [Medium](https://medium.com/nwplusubc) to stay up to date with the latest news on sponsors, prizes and workshops!`,
    ].join("\n\n"),

  rejected: ({ preferredName, displayNameFull }: BlurbProps) =>
    [
      `Hi ${preferredName}`,
      `We are sorry to inform you that we won't be able to give you a spot at ${displayNameFull}. We had a lot of amazing applicants this year, and we are very grateful to have gotten yours.`,
      `We do hope to see your application next year and that this setback isn't the end of your tech career. Please visit [nwplus.io](https://nwplus.io) to learn about more events and other ways to engage with the technology community.`,
    ].join("\n\n"),

  waitlisted: ({ preferredName, displayNameFull, offWaitlistNotify }: BlurbProps) =>
    [
      `Hi ${preferredName}`,
      `We had a lovely time reading your application, and were very impressed with your commitment to joining the technology community. We would love to see you at ${displayNameFull} this year; however, at the moment, we cannot confirm a spot for you. `,
      `You have been put on our waitlist and will be notified by ${offWaitlistNotify} if we find a spot for you, so please check your email then!`,
    ].join("\n\n"),

  closed: ({ displayNameFull }: BlurbProps) =>
    [
      "Hi there,",
      `We are no longer accepting applications for ${displayNameFull}, but we do hope to see you at our future events! `,
      "Visit our website at [nwplus.io](https://nwplus.io) or follow us on social media to learn about our events and other ways to engage with the technology community!",
    ].join("\n\n"),

  acceptedNoResponseYet: ({
    preferredName,
    displayNameFull,
    hackathonWeekend,
    rsvpBy,
  }: BlurbProps) =>
    [
      `Hi ${preferredName}!`,
      `Congratulations! We loved the passion and drive we saw in your application, and we'd love for you to join us at ${displayNameFull} over the weekend of ${hackathonWeekend}!`,
      `Please RSVP before ${rsvpBy} to confirm your spot.`,
    ].join("\n\n"),

  acceptedAndAttending: ({ preferredName, displayNameFull, hackathonWeekend }: BlurbProps) =>
    [
      `Hi ${preferredName}!`,
      `Thank you for RSVPing — you're all set! See you at ${displayNameFull} over the weekend of ${hackathonWeekend}!`,
    ].join("\n\n"),

  acceptedUnRSVP: ({ preferredName, displayNameFull }: BlurbProps) =>
    [
      `Hi ${preferredName}!`,
      `We're sorry you won't be attending ${displayNameFull}. We do hope to see you at our future events, visit our website at [nwplus.io](https://nwplus.io) or follow us on social media to learn about our events and other ways to engage with the technology community!`,
    ].join("\n\n"),
} as const;

export type StatusBlurbKey = keyof typeof statusBlurbs;
