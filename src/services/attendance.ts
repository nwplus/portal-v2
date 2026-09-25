import { db } from "@/lib/firebase/client";
import type { Hacker } from "@/lib/firebase/types/applicants";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export interface AttendanceResult {
  alreadyMarked: boolean;
  eventId: string;
  eventName: string;
}

function getApplicantRef(dbCollectionName: string, uid: string) {
  return doc(db, "Hackathons", dbCollectionName, "Applicants", uid);
}

export async function markPreHackathonAttendance(
  dbCollectionName: string,
  uid: string,
  eventId: string,
  eventName: string,
): Promise<AttendanceResult> {
  const existing = await getApplicant(dbCollectionName, uid);
  const alreadyMarked = existing?.preDayOf?.events?.[eventId] != null;

  if (!alreadyMarked) {
    const ref = getApplicantRef(dbCollectionName, uid);
    await setDoc(
      ref,
      {
        preDayOf: {
          events: {
            [eventId]: {
              eventName,
              timestamp: serverTimestamp(),
            },
          },
        },
      },
      { merge: true },
    );
  }

  return { alreadyMarked, eventId, eventName };
}

async function getApplicant(dbCollectionName: string, uid: string): Promise<Hacker | null> {
  const snap = await getDoc(getApplicantRef(dbCollectionName, uid));
  if (!snap.exists()) return null;
  return snap.data() as Hacker;
}
