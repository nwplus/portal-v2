import { auth, db } from "@/lib/firebase/client";
import type { Attendance } from "@/lib/firebase/types/attendance";
import { collection, getDocs, query, where } from "firebase/firestore";

/** All known check-ins since 2023 for the profile owner, including repeated brands.
 * Count with records.length; filter annual attendance with records.filter by eventYear.
 * Errors propagate so a failed query cannot become a confirmed count of zero.
 */
export async function fetchAttendance(uid: string): Promise<Attendance[]> {
  if (!auth.currentUser) throw new Error("Authentication is required to read Attendance");

  const snapshot = await getDocs(query(collection(db, "Attendance"), where("uid", "==", uid)));
  return snapshot.docs.map((document) => document.data() as Attendance);
}
