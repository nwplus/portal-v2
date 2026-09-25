import type { Attendance } from "./firebase/types/attendance";

export type AttendanceBrand = "hackcamp" | "nwhacks" | "cmd-f";

export function getAttendanceBrands(records: Attendance[]): Set<AttendanceBrand> {
  const brands = new Set<AttendanceBrand>();
  for (const record of records) {
    const id = record.hackathonId.toLowerCase();
    if (id.startsWith("hackcamp")) brands.add("hackcamp");
    else if (id.startsWith("nwhacks")) brands.add("nwhacks");
    else if (id.startsWith("cmd-f") || id.startsWith("cmdf")) brands.add("cmd-f");
  }
  return brands;
}
