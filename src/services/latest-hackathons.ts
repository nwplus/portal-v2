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
 * Fetches the latest hackathon info using the list of hackathon collection names
 *
 * @param activeHackathon - current activeHackathon
 * @returns HackathonInfoItem or null if none found
 */
export async function fetchHackathonInfo(
  activeHackathon: string,
): Promise<HackathonInfoItem | null> {
  const snap = await getDocs(collection(db, "Hackathons"));
  const hackathonIds = snap.docs.map((d) => d.id);
  const latestDbCollectionName = hackathonIds
    .filter((id) => id.toLowerCase().startsWith(activeHackathon))
    .sort((a, b) => {
      const yearA = Number.parseInt(a.match(/\d{4}$/)?.[0] ?? "0", 10);
      const yearB = Number.parseInt(b.match(/\d{4}$/)?.[0] ?? "0", 10);
      return yearB - yearA;
    })[0];

  if (!latestDbCollectionName) return null;

  const { displayNameShort, displayNameFull, hackathonYear } =
    parseDbCollectionName(latestDbCollectionName);

  return {
    dbCollectionName: latestDbCollectionName,
    displayNameShort,
    displayNameFull,
    hackathonYear,
  };
}
