import { DayView } from "@/components/features/schedule/day-view";
import { GradientBackground } from "@/components/layout/gradient-background";
import type { DayOfEvent } from "@/lib/firebase/types";
import { fetchSchedule } from "@/services/schedule";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

type DayGroup = {
  dayKey: string;
  label: string;
  dayValue: number;
  events: DayOfEvent[];
};

function groupEventsByLocalDay(events: DayOfEvent[] = []): DayGroup[] {
  const formatter = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const groups = new Map<string, DayGroup>();

  for (const event of events) {
    if (!event.startTime) continue;

    const startDate = new Date(event.startTime);
    if (Number.isNaN(startDate.getTime())) continue;

    const dayKey = [
      startDate.getFullYear(),
      String(startDate.getMonth() + 1).padStart(2, "0"),
      String(startDate.getDate()).padStart(2, "0"),
    ].join("-");

    const dayValue = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
    ).getTime();
    const label = formatter.format(new Date(dayValue));

    if (!groups.has(dayKey)) {
      groups.set(dayKey, { dayKey, label, dayValue, events: [] });
    }

    groups.get(dayKey)?.events.push(event);
  }

  return Array.from(groups.values()).sort((a, b) => {
    return a.dayValue - b.dayValue;
  });
}

export const Route = createFileRoute("/$activeHackathon/(information)/schedule")({
  loader: async ({ context }) => {
    const { dbCollectionName } = context;
    if (!dbCollectionName) {
      return { dayOfEvents: null };
    }

    const dayOfEvents = await fetchSchedule(dbCollectionName);
    return { dayOfEvents };
  },
  component: () => <RouteComponent />,
});

function RouteComponent() {
  const { dayOfEvents } = Route.useLoaderData();
  const groupedDays = useMemo(() => groupEventsByLocalDay(dayOfEvents ?? []), [dayOfEvents]);

  return (
    <GradientBackground gradientPosition="topLeft">
      <div className="pb-14">
        <div>{/* Floating anchor links for the different dates */}</div>

        {groupedDays.map((day) => (
          <DayView key={day.dayKey} dayLabel={day.label} events={day.events} />
        ))}
      </div>
    </GradientBackground>
  );
}
