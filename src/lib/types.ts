import type { Timestamp } from "firebase/firestore";
import type { z } from "zod";
import type { VALID_HACKATHONS } from "./constants";

export type HackathonName = z.infer<typeof VALID_HACKATHONS>;

export type HackathonInfoItem = {
  dbCollectionName: string;
  displayNameFull: string;
  displayNameShort: string;
  hackathonYear: number;
};

type Primitive = string | number | boolean | bigint | symbol | null | undefined;
type NonRecurse = Primitive | Timestamp;

/**
 * Utility type to author deep patch objects compatible with our deepMerge semantics
 * ex: used for ApplicantDraft while a user fills out the application
 * Recurse only into plain objects; arrays are replaced; built-ins (e.g., Firestore Timestamp) are not recursed.
 */
export type DeepPartial<T> = T extends NonRecurse
  ? T
  : T extends readonly unknown[] | unknown[]
    ? T
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;
