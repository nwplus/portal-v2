import type { Timestamp } from "firebase/firestore";

/**
 * One entry of /Hackathons/[hackathon].promotions, public metadata only (codes never live here)
 * `id` is what the portal claims by; without it promotionKey() slugs the sponsor. `sponsor` is
 * optional too, in which case sponsorName() title-cases the id
 */
export interface Promotion {
  id?: string;
  sponsor?: string;
  type: "discount_code" | "discount_codes" | string;
  instructions: string;
  redemption_url: string;
  available: boolean;
}

/**
 * Admin Timestamps come back from a callable as plain objects, not firebase/firestore Timestamps
 */
type SerializedTimestamp = { _seconds: number; _nanoseconds: number };

/**
 * /Hackathons/[hackathon]/Applicants/[uid].claimedPromotions.[promotionId]
 * Written only by the claimPromotion function; the Promotions subcollection is the source of truth
 */
export interface ClaimedPromotion {
  promotionId: string;
  codeDocId: string;
  sponsor: string;
  type: Promotion["type"];
  code: string;
  instructions: string;
  redemption_url: string;
  claimedAt: Timestamp | SerializedTimestamp;
}

export interface ClaimPromotionInput {
  dbCollectionName: string;
  promotionId: string;
}

export type ClaimPromotionResult =
  | { status: "claimed"; claim: ClaimedPromotion }
  | { status: "alreadyClaimed"; claim: ClaimedPromotion }
  | { status: "soldOut" }
  | { status: "unavailable" };
