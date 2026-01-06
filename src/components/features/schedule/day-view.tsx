import type { DayOfEvent } from "@/lib/firebase/types";
import { useEffect, useMemo, useState } from "react";
import { EventBlock } from "./event-block";

type DayViewProps = {
  dayLabel: string;
  events: (DayOfEvent & { location?: string })[];
  hideTitle?: boolean;
};

type PositionedEvent = {
  id: string;
  top: number;
  height: number;
  leftPct: number;
  widthPct: number;
  startLabel: string;
  endLabel: string;
  column: number;
  columns: number;
  name?: string;
  description?: string;
  location?: string;
  points?: string;
};

type TimeLabel = {
  id: string;
  top: number;
  label: string;
};

const MIN_EVENT_DURATION_MINUTES = 30;
const PIXELS_PER_MINUTE = 2;
const TEST_TIME_ISO: string | null = null; // set to an ISO string for visual testing (i.e. "2025-01-18T17:00:00.000Z")
const OVERLAP_CARD_PADDING_PCT = 0.5;

function minutesSinceMidnight(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function formatTime(date: Date, short?: boolean) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: short ? undefined : "2-digit",
  }).format(date);
}

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildTimeline(events: (DayOfEvent & { location?: string })[]) {
  const parsed = events
    .map((event) => {
      if (!event.startTime) return null;
      const start = new Date(event.startTime);
      if (Number.isNaN(start.getTime())) return null;

      const end = event.endTime ? new Date(event.endTime) : null;
      const resolvedEnd =
        end && !Number.isNaN(end.getTime())
          ? end
          : new Date(start.getTime() + MIN_EVENT_DURATION_MINUTES * 60_000);

      return { event, start, end: resolvedEnd };
    })
    .filter(Boolean) as { event: DayOfEvent & { location?: string }; start: Date; end: Date }[];

  if (parsed.length === 0) {
    return {
      positioned: [] as PositionedEvent[],
      labels: [] as TimeLabel[],
      height: 0,
      timelineStart: undefined,
      timelineEnd: undefined,
      dayDate: undefined,
    };
  }

  parsed.sort((a, b) => a.start.getTime() - b.start.getTime());

  const baseDate = parsed[0].start;
  const dayDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const dayStartMs = dayDate.getTime();

  const minStart = Math.min(
    ...parsed.map(({ start }) => Math.round((start.getTime() - dayStartMs) / 60_000)),
  );
  const maxEnd = Math.max(
    ...parsed.map(({ end }) => Math.round((end.getTime() - dayStartMs) / 60_000)),
  );

  const timelineStart = Math.floor(minStart / 60) * 60;
  const timelineEnd = Math.ceil(maxEnd / 60) * 60;
  const timelineHeight = Math.max((timelineEnd - timelineStart) * PIXELS_PER_MINUTE, 1);

  const labels: TimeLabel[] = [];
  for (let minutes = timelineStart; minutes <= timelineEnd; minutes += 60) {
    const labelDate = new Date(dayStartMs + minutes * 60_000);
    labels.push({
      id: `${minutes}`,
      top: (minutes - timelineStart) * PIXELS_PER_MINUTE,
      label: formatTime(labelDate, true),
    });
  }

  type EventSegment = PositionedEvent & {
    startMinutes: number;
    endMinutes: number;
    clusterId: number;
  };

  const segments: EventSegment[] = parsed.map(({ event, start, end }) => {
    const startMinutes = Math.round((start.getTime() - dayStartMs) / 60_000);
    const endMinutes = Math.round((end.getTime() - dayStartMs) / 60_000);
    const durationMinutes = Math.max(endMinutes - startMinutes, MIN_EVENT_DURATION_MINUTES);

    return {
      id: event.eventID ?? event.key,
      top: (startMinutes - timelineStart) * PIXELS_PER_MINUTE,
      height: durationMinutes * PIXELS_PER_MINUTE,
      startLabel: formatTime(start),
      endLabel: formatTime(end),
      name: event.name,
      description: event.description,
      location: event.location,
      points: event.points,
      column: 0,
      columns: 1,
      leftPct: 0,
      widthPct: 100,
      startMinutes,
      endMinutes,
      clusterId: 0,
    };
  });

  // Assign columns and widths within clusters of overlapping events.
  const active: { end: number; column: number }[] = [];
  let currentClusterId = 0;
  let clusterMaxColumns = 0;
  const clusterMax: Record<number, number> = {};

  segments.forEach((segment, idx) => {
    for (let i = active.length - 1; i >= 0; i -= 1) {
      if (active[i].end <= segment.startMinutes) {
        active.splice(i, 1);
      }
    }

    if (active.length === 0) {
      currentClusterId += 1;
      clusterMaxColumns = 0;
    }

    const usedColumns = active.map((item) => item.column);
    let column = 0;
    while (usedColumns.includes(column)) {
      column += 1;
    }

    active.push({ end: segment.endMinutes, column });
    const columnsNow = active.length;
    clusterMaxColumns = Math.max(clusterMaxColumns, columnsNow);
    clusterMax[currentClusterId] = clusterMaxColumns;

    segments[idx] = { ...segment, column, clusterId: currentClusterId };
  });

  const positionedWithSize = segments.map((segment) => {
    const columnsForCluster = clusterMax[segment.clusterId] ?? 1;
    const widthPct = 100 / columnsForCluster - OVERLAP_CARD_PADDING_PCT; // subtract padding
    return {
      ...segment,
      columns: columnsForCluster,
      widthPct,
      leftPct: segment.column * widthPct + segment.column * OVERLAP_CARD_PADDING_PCT,
    };
  });

  return {
    positioned: positionedWithSize,
    labels,
    height: timelineHeight,
    timelineStart,
    timelineEnd,
    dayDate,
  };
}

export function DayView({ dayLabel, events, hideTitle = false }: DayViewProps) {
  const timeline = useMemo(() => buildTimeline(events), [events]);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const displayNow = useMemo(() => {
    if (TEST_TIME_ISO) {
      const testDate = new Date(TEST_TIME_ISO);
      if (!Number.isNaN(testDate.getTime())) return testDate;
    }
    return now;
  }, [now]);

  const currentMinutes = minutesSinceMidnight(displayNow);
  const currentTop =
    timeline.timelineStart !== undefined
      ? (currentMinutes - timeline.timelineStart) * PIXELS_PER_MINUTE
      : 0;
  const showCurrentLine =
    timeline.height > 0 &&
    timeline.timelineStart !== undefined &&
    timeline.dayDate !== undefined &&
    isSameLocalDay(displayNow, timeline.dayDate) &&
    currentTop >= 0 &&
    currentTop <= timeline.height;

  return (
    <section className="flex flex-col gap-2 py-4 pr-2">
      {!hideTitle && <div className="pl-16 text-text-primary text-xl md:pl-28">{dayLabel}</div>}
      <div className="flex gap-0 md:gap-4">
        <div className="relative w-16 md:w-24" style={{ minHeight: timeline.height }}>
          {timeline.labels.map((label) => (
            <div
              key={label.id}
              className="absolute w-full pr-4 text-right text-sm text-text-primary"
              style={{ top: label.top }}
            >
              {label.label}
            </div>
          ))}
        </div>

        <div className="relative flex-1" style={{ minHeight: timeline.height }}>
          {showCurrentLine && (
            <div
              className="-left-16 md:-left-24 absolute right-0 z-20"
              style={{ top: currentTop, pointerEvents: "none" }}
            >
              <div className="flex items-center gap-0 md:gap-2">
                <div className="shrink-0 rounded-md border border-line-accent bg-bg-translucent-card px-1.5 py-1 font-medium text-line-accent text-xs backdrop-blur-md md:px-2">
                  {formatTime(displayNow)}
                </div>
                <div className="flex w-full items-center">
                  <div className="hidden h-1.5 w-1.5 rounded-full bg-line-accent shadow-sm md:block" />
                  <div className="h-px flex-1 border-line-accent border-t" />
                </div>
              </div>
            </div>
          )}

          {timeline.positioned.map((item) => (
            <EventBlock
              key={item.id}
              position={{
                leftPct: item.leftPct,
                top: item.top,
                height: item.height,
                widthPct: item.widthPct,
              }}
              {...item}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
