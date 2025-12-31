import { useEffect, useState } from "react";

export type TimeOfDay = "DAWN" | "MORNING" | "AFTERNOON" | "EVENING" | "MIDNIGHT";

export function useTimeOfDay(): TimeOfDay {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() => {
    const hour = new Date().getHours();
    return getTimeOfDay(hour);
  });

  useEffect(() => {
    const updateTimeOfDay = () => {
      const hour = new Date().getHours();
      setTimeOfDay(getTimeOfDay(hour));
    };

    const interval = setInterval(updateTimeOfDay, 60000);

    return () => clearInterval(interval);
  }, []);

  return timeOfDay;
}

function getTimeOfDay(hour: number): TimeOfDay {
  // MIDNIGHT: 0-5 (late night/early morning)
  if (hour >= 0 && hour < 5) {
    return "MIDNIGHT";
  }
  // DAWN: 5-7 (sunrise time)
  if (hour >= 5 && hour < 7) {
    return "DAWN";
  }
  // MORNING: 7-12
  if (hour >= 7 && hour < 12) {
    return "MORNING";
  }
  // AFTERNOON: 12-17
  if (hour >= 12 && hour < 17) {
    return "AFTERNOON";
  }
  // EVENING: 17-22
  if (hour >= 17 && hour < 22) {
    return "EVENING";
  }
  // MIDNIGHT: 22-24 (late night)
  return "MIDNIGHT";
}
