import type { z } from "zod";
import type { VALID_HACKATHONS } from "./constants";

export type HackathonName = z.infer<typeof VALID_HACKATHONS>;

export type HackathonInfoItem = {
  dbCollectionName: string;
  displayNameFull: string;
  displayNameShort: string;
  hackathonYear: number;
};
