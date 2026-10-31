import type { Timestamp } from "firebase/firestore";

/**
 * Sub-collection: /Hackathons/[hackathon]/CtfChallenges
 * Written by the Functions-new ops script; title, description and link only exist once opened
 */
export interface CtfChallenge {
  _id: string;
  order: number;
  isOpen: boolean;
  title?: string;
  description?: string;
  link?: string;
  stampId: string;
  pointsTable: number[];
  defaultPoints: number;
  totalFlags: number;
  claimedCount: number;
}

/**
 * Sub-collection: /Hackathons/[hackathon]/CtfSolves, doc ID `{uid}_{challengeId}`
 * Written only by the submitCtfFlag function; hackers can read their own
 */
export interface CtfSolve {
  _id: string;
  uid: string;
  email: string;
  challengeId: string;
  rank: number;
  points: number;
  flagHash: string;
  solvedAt: Timestamp;
}

export interface SubmitCtfFlagInput {
  dbCollectionName: string;
  flag: string;
}

export type SubmitCtfFlagResult =
  | { status: "solved"; challengeId: string; rank: number; points: number; stampName: string }
  | { status: "alreadySolved"; challengeId: string; rank: number; points: number }
  | { status: "invalid" }
  | { status: "claimed" }
  | { status: "closed" };
