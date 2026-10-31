import { auth } from "@/lib/firebase/client";
import type { Attendance } from "@/lib/firebase/types/attendance";
import { useAuthStore } from "@/lib/stores/auth-store";
import { fetchAttendance } from "@/services/attendance";
import type { User } from "firebase/auth";
import { useEffect, useState } from "react";

export type AttendanceState =
  | { status: "idle" | "loading"; records: null; count: null }
  | { status: "error"; records: null; count: null; error: unknown }
  | { status: "success"; records: Attendance[]; count: number };

/** Keep unknown attendance separate from a successful empty result. */
export function useAttendance(uid: string): AttendanceState {
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.loading);
  const [result, setResult] = useState<{
    uid: string;
    user: User;
    state: AttendanceState;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setResult(null);
    if (authLoading || !user || !uid || auth.currentUser !== user) return;

    const publish = (state: AttendanceState) => {
      if (!cancelled && auth.currentUser === user) setResult({ uid, user, state });
    };
    fetchAttendance(uid).then(
      (records) => publish({ status: "success", records, count: records.length }),
      (error: unknown) => publish({ status: "error", records: null, count: null, error }),
    );
    return () => {
      cancelled = true;
    };
  }, [uid, user, authLoading]);

  if (authLoading || !user || !uid || auth.currentUser !== user) {
    return { status: "idle", records: null, count: null };
  }
  // Guard during render as well: effects run after the new profile has rendered.
  if (result?.uid !== uid || result.user !== user) {
    return { status: "loading", records: null, count: null };
  }
  return result.state;
}
