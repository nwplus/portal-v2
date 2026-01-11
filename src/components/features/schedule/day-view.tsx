import type { DayOfEvent } from "@/lib/firebase/types";
import { useEffect, useMemo, useState } from "react";
import { EventBlock } from "./event-block";

interface DayViewProps {
  dayLabel: string;
  events: (DayOfEvent & { location?: string })[];
  hideTitle?: boolean;
  dayDate: Date;
  fullHeight?: boolean;
}

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
  event: DayOfEvent;
};

type TimeLabel = {
  id: string;
  top: number;
  label: string;
};

type EventSegment = PositionedEvent & {
  startMinutes: number;
  endMinutes: number;
  clusterId: number;
};

const MIN_EVENT_DURATION_MINUTES = 30;
const PIXELS_PER_MINUTE = 2;
const TEST_TIME_ISO: string | null = null; // set to an ISO string for visual testing (i.e. "2025-01-18T17:00:00.000Z")
const OVERLAP_CARD_PADDING_PCT = 0.5;

function getLocalDayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatTime(date: Date, short?: boolean) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: short ? undefined : "2-digit",
  }).format(date);
}

function isSameLocalDay(a: Date, b: Date) {
  return getLocalDayStart(a).getTime() === getLocalDayStart(b).getTime();
}

function assignOverlapColumns(segments: EventSegment[]): {
  segments: EventSegment[];
  clusterMax: Record<number, number>;
} {
  const active: { endMinutes: number; column: number }[] = [];
  let currentClusterId = 0;
  const clusterMax: Record<number, number> = {};
  const segmentsWithColumns: EventSegment[] = [];

  for (const segment of segments) {
    for (let i = active.length - 1; i >= 0; i -= 1) {
      if (active[i].endMinutes <= segment.startMinutes) {
        active.splice(i, 1);
      }
    }

    if (active.length === 0) {
      currentClusterId += 1;
    }

    const usedColumns = new Set(active.map((item) => item.column));
    let column = 0;
    while (usedColumns.has(column)) {
      column += 1;
    }

    active.push({ endMinutes: segment.endMinutes, column });
    clusterMax[currentClusterId] = Math.max(clusterMax[currentClusterId] ?? 0, active.length);

    segmentsWithColumns.push({ ...segment, column, clusterId: currentClusterId });
  }

  return { segments: segmentsWithColumns, clusterMax };
}

function buildTimeline(
  events: (DayOfEvent & { location?: string })[],
  dayDate: Date,
  fullHeight = false,
) {
  // 1. parse and validate event times
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

  const resolvedDayDate = getLocalDayStart(dayDate);
  const dayStartMs = resolvedDayDate.getTime();
  const dayEndMs = new Date(
    resolvedDayDate.getFullYear(),
    resolvedDayDate.getMonth(),
    resolvedDayDate.getDate() + 1,
  ).getTime();
  const minutesInDay = Math.round((dayEndMs - dayStartMs) / 60_000);

  if (parsed.length === 0 && !fullHeight) {
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

  // 3. clip events to day boundaries
  const clipped = parsed
    .map(({ event, start, end }) => {
      const resolvedEnd = end.getTime() < start.getTime() ? start : end;
      const clippedStartMs = Math.max(start.getTime(), dayStartMs);
      const clippedEndMs = Math.min(resolvedEnd.getTime(), dayEndMs);

      if (clippedEndMs <= dayStartMs || clippedStartMs >= dayEndMs) return null;

      const startMinutes = Math.max(
        0,
        Math.min(minutesInDay, (clippedStartMs - dayStartMs) / 60_000),
      );
      const endMinutes = Math.max(0, Math.min(minutesInDay, (clippedEndMs - dayStartMs) / 60_000));

      if (endMinutes <= 0 || startMinutes >= minutesInDay) return null;

      const safeEndMinutes =
        endMinutes <= startMinutes
          ? Math.min(startMinutes + MIN_EVENT_DURATION_MINUTES, minutesInDay)
          : endMinutes;

      return {
        event,
        originalStart: start,
        originalEnd: resolvedEnd,
        startMinutes,
        endMinutes: safeEndMinutes,
      };
    })
    .filter(Boolean) as {
    event: DayOfEvent & { location?: string };
    originalStart: Date;
    originalEnd: Date;
    startMinutes: number;
    endMinutes: number;
  }[];

  if (clipped.length === 0 && !fullHeight) {
    return {
      positioned: [] as PositionedEvent[],
      labels: [] as TimeLabel[],
      height: 0,
      timelineStart: undefined,
      timelineEnd: undefined,
      dayDate: undefined,
    };
  }

  // 4. calculate timeline bounds
  const minStart =
    clipped.length > 0
      ? Math.min(...clipped.map(({ startMinutes }) => Math.round(startMinutes)))
      : 0;
  const maxEnd =
    clipped.length > 0
      ? Math.max(...clipped.map(({ endMinutes }) => Math.round(endMinutes)))
      : minutesInDay;

  const timelineStart = fullHeight ? 0 : Math.floor(minStart / 60) * 60;
  const timelineEnd = fullHeight ? minutesInDay : Math.ceil(maxEnd / 60) * 60;
  const timelineHeight = Math.max((timelineEnd - timelineStart) * PIXELS_PER_MINUTE, 1);

  // 5. generate hour labels
  const labels: TimeLabel[] = [];
  for (let minutes = timelineStart; minutes <= timelineEnd; minutes += 60) {
    const labelDate = new Date(dayStartMs + minutes * 60_000);
    labels.push({
      id: `${minutes}`,
      top: (minutes - timelineStart) * PIXELS_PER_MINUTE,
      label: formatTime(labelDate, true),
    });
  }

  // 6. create positioned segments
  const segments: EventSegment[] = clipped.map(
    ({ event, startMinutes, endMinutes, originalStart, originalEnd }) => {
      const roundedStartMinutes = Math.round(startMinutes);
      const roundedEndMinutes = Math.round(endMinutes);
      const durationMinutes = Math.max(
        roundedEndMinutes - roundedStartMinutes,
        MIN_EVENT_DURATION_MINUTES,
      );

      return {
        id: event.eventID ?? event.key,
        top: (roundedStartMinutes - timelineStart) * PIXELS_PER_MINUTE,
        height: durationMinutes * PIXELS_PER_MINUTE,
        startLabel: formatTime(originalStart),
        endLabel: formatTime(originalEnd),
        event,
        column: 0,
        columns: 1,
        leftPct: 0,
        widthPct: 100,
        startMinutes: roundedStartMinutes,
        endMinutes: roundedEndMinutes,
        clusterId: 0,
      };
    },
  );

  // 7. assign columns for overlapping events
  const { segments: segmentsWithColumns, clusterMax } = assignOverlapColumns(segments);

  // 8. compute final widths based on cluster column counts
  const positioned = segmentsWithColumns.map((segment) => {
    const columnsForCluster = clusterMax[segment.clusterId] ?? 1;
    const columnGapPct = OVERLAP_CARD_PADDING_PCT;
    const widthPct = 100 / columnsForCluster - columnGapPct;
    return {
      ...segment,
      columns: columnsForCluster,
      widthPct,
      leftPct: segment.column * (widthPct + columnGapPct),
    };
  });

  return {
    positioned,
    labels,
    height: timelineHeight,
    timelineStart,
    timelineEnd,
    dayDate: resolvedDayDate,
  };
}

export function DayView({
  dayLabel,
  events,
  hideTitle = false,
  dayDate,
  fullHeight = false,
}: DayViewProps) {
  const timeline = useMemo(
    () => buildTimeline(events, dayDate, fullHeight),
    [events, dayDate, fullHeight],
  );
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

  const currentDayStartMs = getLocalDayStart(displayNow).getTime();
  const currentMinutes = Math.floor((displayNow.getTime() - currentDayStartMs) / 60_000);
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
    <section className={"flex flex-col gap-2 py-4 pr-2"}>
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
                <div className="shrink-0 rounded-md border border-line-accent px-1.5 py-1 font-medium text-line-accent text-xs backdrop-blur-md [background:var(--background-translucent-card)] md:px-2">
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
