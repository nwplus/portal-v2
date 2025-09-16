import { db } from "@/lib/firebase/client";
import type { HackathonConfigItem } from "@/lib/types";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useHackathon } from "./use-hackathon";

/**
 * Builds display names from the firebase collection name
 *
 * Ex: "nwHacks2025" -> { displayNameShort: "nwHacks", displayNameFull: "nwHacks 2025" }
 *
 * @param dbCollectionName - firestore collection name
 * @returns object containing short and full display names for the associated hackathon
 */
function buildDisplayNames(dbCollectionName: string) {
  const base = dbCollectionName.replace(/\d{4}$/, "");
  const year = dbCollectionName.match(/\d{4}$/)?.[0];

  return {
    displayNameShort: base,
    displayNameFull: `${base} ${year}`,
  };
}

export function useHackathonConfig(): HackathonConfigItem {
  const { activeHackathon } = useHackathon();
  const [dbCollectionName, setDbCollectionName] = useState<string>("");

  useEffect(() => {
    getDocs(collection(db, "Hackathons"))
      .then((snap) => {
        const hackathonIds = snap.docs.map((d) => d.id);
        const latest = hackathonIds
          .filter((id) => id.toLowerCase().startsWith(activeHackathon))
          .sort((a, b) => {
            const yearA = Number.parseInt(a.match(/\d{4}$/)?.[0] ?? "0", 10);
            const yearB = Number.parseInt(b.match(/\d{4}$/)?.[0] ?? "0", 10);
            return yearB - yearA;
          })[0];
        if (latest) setDbCollectionName(latest);
      })
      .catch((error) => {
        throw new Error(`Failed to load hackathon configuration: ${error.message}`);
      });
  }, [activeHackathon]);

  const { displayNameShort, displayNameFull } = useMemo(
    () => buildDisplayNames(dbCollectionName),
    [dbCollectionName],
  );
  return { dbCollectionName, displayNameShort, displayNameFull };
}
