import { type TimeOfDay, useTimeOfDay } from "@/hooks/use-time-of-day";
import type { Applicant } from "@/lib/firebase/types/applicants";
import { useMemo } from "react";

type WelcomeMessage = {
  message: string;
  emoji: string;
};

function getWelcomeMessage(timeOfDay: TimeOfDay, applicantName: string): WelcomeMessage {
  const messages: Record<TimeOfDay, string[]> = {
    MIDNIGHT: [
      `Burning the midnight oil, ${applicantName}?`,
      `Still up, ${applicantName}?`,
      `Late night coding, ${applicantName}?`,
      `Working late, ${applicantName}?`,
    ],
    DAWN: [
      `Early bird, ${applicantName}!`,
      `Rising with the sun, ${applicantName}?`,
      `Up at dawn, ${applicantName}?`,
      `Starting early, ${applicantName}?`,
    ],
    MORNING: [
      `Good morning, ${applicantName}`,
      `Morning, ${applicantName}!`,
      `Rise and shine, ${applicantName}!`,
      `Good morning, ${applicantName}!`,
    ],
    AFTERNOON: [
      `Good afternoon, ${applicantName}`,
      `Afternoon, ${applicantName}!`,
      `Hope your day is going well, ${applicantName}!`,
      `Good afternoon, ${applicantName}!`,
    ],
    EVENING: [
      `Good evening, ${applicantName}`,
      `Evening, ${applicantName}!`,
      `Hope you had a great day, ${applicantName}!`,
      `Good evening, ${applicantName}!`,
    ],
  };

  const emojis: Record<TimeOfDay, string[]> = {
    MIDNIGHT: ["🌙", "🌃", "🌌", "⭐"],
    DAWN: ["🌅", "🌄", "🌆", "☀️"],
    MORNING: ["☀️", "🌞", "🌻", "☕"],
    AFTERNOON: ["☀️", "🌤️", "🌞", "✨"],
    EVENING: ["🌆", "🌇", "🌃", "🌙"],
  };

  const timeMessages = messages[timeOfDay];
  const timeEmojis = emojis[timeOfDay];

  // Use a hash of the name and timeOfDay to get consistent selection per time period
  const hash = (applicantName.length + timeOfDay.length) % timeMessages.length;
  const selectedIndex = hash;

  return {
    message: timeMessages[selectedIndex] ?? timeMessages[0] ?? "",
    emoji: timeEmojis[selectedIndex] ?? timeEmojis[0] ?? "👋",
  };
}

export function Message({
  applicant,
}: {
  applicant: Applicant | null;
}) {
  const applicantName =
    applicant?.basicInfo?.preferredName ?? applicant?.basicInfo?.legalFirstName ?? "hacker";
  const timeOfDay = useTimeOfDay();

  const welcomeMessage = useMemo(
    () => (applicantName ? getWelcomeMessage(timeOfDay, applicantName) : null),
    [timeOfDay, applicantName],
  );

  if (!welcomeMessage) {
    return <div>{JSON.stringify(welcomeMessage)}</div>;
  }

  const { message, emoji } = welcomeMessage;

  return (
    <div className="mx-auto flex flex-col items-center gap-2 pt-4">
      <div className="text-4xl">{emoji}</div>
      <div className="text-4xl">{message}</div>
    </div>
  );
}
