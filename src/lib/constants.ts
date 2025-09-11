import { z } from "zod";
import type { HackathonConfigItem } from "./types";

// used for URL routing validation
export const VALID_HACKATHONS = z.enum(["cmd-f", "hackcamp", "nwhacks"]);

export const HACKATHON_CONFIG = {
  "cmd-f": {
    dbCollectionName: "cmd-f2026",
    displayNameFull: "cmd-f 2026",
    displayNameShort: "cmd-f",
  },
  hackcamp: {
    dbCollectionName: "HackCamp2025",
    displayNameFull: "HackCamp 2025",
    displayNameShort: "HackCamp",
  },
  nwhacks: {
    dbCollectionName: "nwHacks2026",
    displayNameFull: "nwHacks 2026",
    displayNameShort: "nwHacks",
  },
} as const satisfies Record<z.infer<typeof VALID_HACKATHONS>, HackathonConfigItem>;
