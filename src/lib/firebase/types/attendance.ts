import type { Timestamp } from "firebase/firestore";

export interface Attendance {
  uid: string;
  hackathonId: string;
  eventYear: number;
  recordedAt: Timestamp;
  sourceVersion: 1;
  backfillRunId?: string;
}
