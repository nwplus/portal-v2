import { db } from "@/lib/firebase/client";
import type { HackathonInfoItem } from "@/lib/types";
import { collection, getDocs } from "firebase/firestore";

/**
 * Parses info from the firestore collection name
 *
 * Ex: "nwHacks2025" -> { displayNameShort: "nwHacks", displayNameFull: "nwHacks 2025", hackathonYear: 2025 }
 *
 * @param dbCollectionName - firestore collection name
 * @returns object containing display names and year for the associated hackathon
 */
export function parseDbCollectionName(dbCollectionName: string) {
  const base = dbCollectionName.replace(/\d{4}$/, "");
  const year = dbCollectionName.match(/\d{4}$/)?.[0] ?? "0";

  return {
    displayNameShort: base,
    displayNameFull: `${base} ${year}`,
    hackathonYear: Number.parseInt(year, 10),
  };
}

/**
 * Fetches the latest hackathon collection matching the provided slug prefix
 * The "latest" is determined by a 4-digit year suffix in the collection name
 *
 * @param activeHackathonSlug - lowercased slug such as "hackcamp", "nwhacks", etc.
 * @returns HackathonInfoItem or null if none found
 */
export async function fetchLatestHackathons(
  activeHackathonSlug: string,
): Promise<HackathonInfoItem | null> {
  const snap = await getDocs(collection(db, "Hackathons"));
  const hackathonIds = snap.docs.map((d) => d.id);
  const latest = hackathonIds
    .filter((id) => id.toLowerCase().startsWith(activeHackathonSlug))
    .sort((a, b) => {
      const yearA = Number.parseInt(a.match(/\d{4}$/)?.[0] ?? "0", 10);
      const yearB = Number.parseInt(b.match(/\d{4}$/)?.[0] ?? "0", 10);
      return yearB - yearA;
    })[0];

  if (!latest) return null;

  const { displayNameShort, displayNameFull, hackathonYear } = parseDbCollectionName(latest);

  return {
    dbCollectionName: latest,
    displayNameShort,
    displayNameFull,
    hackathonYear,
  };
}
