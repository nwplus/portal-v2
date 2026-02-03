import { useHackathon } from "@/hooks/use-hackathon";
import { usePortalStore } from "@/lib/stores/portal-store";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

type Status = "PRE" | "DURING" | "POST" | null;

export function Countdown() {
  const { activeHackathon } = useHackathon();
  const hackingStart = usePortalStore((state) => state.hackingStart);
  const hackingEnd = usePortalStore((state) => state.hackingEnd);
  const [now, setNow] = useState(new Date());
  const [days, setDays] = useState("00");
  const [hours, setHours] = useState("00");
  const [minutes, setMinutes] = useState("00");
  const [seconds, setSeconds] = useState("00");

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { status, target } = useMemo<{
    status: Status;
    target: Date | null;
  }>(() => {
    const startStr = hackingStart?.[activeHackathon];
    const endStr = hackingEnd?.[activeHackathon];
    if (!startStr || !endStr) return { status: null, target: null };

    const start = new Date(startStr);
    const end = new Date(endStr);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { status: null, target: null };
    }

    if (now < start) return { status: "PRE", target: start };
    if (now < end) return { status: "DURING", target: end };
    return { status: "POST", target: null };
  }, [activeHackathon, hackingEnd, hackingStart, now]);

  const remainingMs = target ? Math.max(0, target.getTime() - now.getTime()) : 0;

  useEffect(() => {
    const totalSeconds = Math.floor(remainingMs / 1000);
    const totalHours = Math.floor(totalSeconds / 3600);

    const showDays = totalHours > 99;
    const daysValue = showDays ? Math.floor(totalSeconds / 86400) : 0;
    const hoursValue = showDays
      ? Math.floor((totalSeconds % 86400) / 3600)
      : Math.floor(totalSeconds / 3600);

    const minutesValue = Math.floor((totalSeconds % 3600) / 60);
    const secondsValue = totalSeconds % 60;

    const pad = (v: number) => v.toString().padStart(2, "0");

    setDays(pad(daysValue));
    setHours(pad(hoursValue));
    setMinutes(pad(minutesValue));
    setSeconds(pad(secondsValue));
  }, [remainingMs]);

  if (!status) return null;

  const label =
    status === "PRE"
      ? "Hacking starts in"
      : status === "POST"
        ? "Hacking ended"
        : "Hacking ends in";

  const totalHours = Math.floor(remainingMs / 1000 / 3600);
  const showDays = totalHours > 100;

  const timeUnits = showDays
    ? [
        { value: days, label: "DAYS" },
        { value: hours, label: "HRS" },
        { value: minutes, label: "MIN" },
        { value: seconds, label: "SEC" },
      ]
    : [
        { value: hours, label: "HRS" },
        { value: minutes, label: "MIN" },
        { value: seconds, label: "SEC" },
      ];

  return (
    <div className="relative mx-auto w-[90%] overflow-hidden rounded-full md:w-108">
      <div className="-translate-y-1/2 absolute top-0 left-0 z-0 h-[200%] w-full bg-radial from-[rgba(105,46,32,0.5)] to-1/20 to-[rgba(105,46,32,0)]" />
      <div className="relative flex items-center justify-between px-8 py-4">
        <div className="text-base md:text-lg">{label}</div>
        <div className={cn("grid gap-3", showDays ? "grid-cols-4" : "grid-cols-3")}>
          {timeUnits.map((unit) => (
            <div key={unit.label} className="flex flex-col items-center">
              <div className="text-xl md:text-2xl">{unit.value}</div>
              <div className="text-sm">{unit.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
