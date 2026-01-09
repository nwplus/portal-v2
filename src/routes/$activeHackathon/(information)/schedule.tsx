import { DayView } from "@/components/features/schedule/day-view";
import { GradientBackground } from "@/components/layout/gradient-background";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();
  const groupedDays = useMemo(() => groupEventsByLocalDay(dayOfEvents ?? []), [dayOfEvents]);

  console.log(groupedDays);

  return (
    <TooltipProvider>
      {/* ToolTip is used in the event-block.tsx */}
      <GradientBackground
        gradientPosition={isMobile ? "bottomMiddle" : "topLeft"}
        className="py-10"
      >
        {groupedDays ? (
          <Tabs defaultValue={groupedDays[0].label}>
            {/* NOTE: manually added styles here, another PR will add default styles to tabs */}
            <TabsList className="ml-16 border border-border-subtle bg-border-active/10 md:ml-28">
              {groupedDays.map((day) => (
                <TabsTrigger
                  key={day.dayKey}
                  value={day.label}
                  className="data-[state=active]:bg-bg-main/30"
                >
                  {day.label.split(",")[0]}
                </TabsTrigger>
              ))}
            </TabsList>
            {groupedDays.map((day) => (
              <TabsContent key={day.dayKey} value={day.label}>
                <DayView hideTitle key={day.dayKey} dayLabel={day.label} events={day.events} />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="w-full p-10 text-center text-text-secondary">
            Schedule has not been added yet, please check back later.
          </div>
        )}
      </GradientBackground>
    </TooltipProvider>
  );
}
