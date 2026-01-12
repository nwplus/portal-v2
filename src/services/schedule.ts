import { db } from "@/lib/firebase/client";
import type { DayOfEvent } from "@/lib/firebase/types";
import { collection, getDocs, query } from "firebase/firestore";

/**
 * Utility to get hackathon's schedule
 *
 * @param hackathonId - the hackathon of the events
 * @returns a list of DayOf events of the specified hackathon
 */
export async function fetchSchedule(
  hackathonId: string,
): Promise<(DayOfEvent & { _id: string })[]> {
  const ref = collection(db, "Hackathons", hackathonId, "DayOf");
  const q = query(ref);

  const querySnapshot = await getDocs(q);
  const events: (DayOfEvent & { _id: string })[] = [];

  for (const doc of querySnapshot.docs) {
    const data = doc.data() as DayOfEvent;
    events.push({
      _id: doc.id,
      ...data,
    });
  }

  return events;
}
