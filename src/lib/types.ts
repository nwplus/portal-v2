import type { z } from "zod";
import type { VALID_HACKATHONS } from "./constants";

export type HackathonName = z.infer<typeof VALID_HACKATHONS>;

export type HackathonConfigItem = {
  dbCollectionName: string;
  displayNameFull: string;
  displayNameShort: string;
};
