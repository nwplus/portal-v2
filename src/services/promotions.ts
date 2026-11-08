import { db, functions } from "@/lib/firebase/client";
import type { Hackathon } from "@/lib/firebase/types";
import type {
  ClaimPromotionInput,
  ClaimPromotionResult,
  Promotion,
} from "@/lib/firebase/types/promotions";
import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

const claimPromotionCallable = httpsCallable<ClaimPromotionInput, ClaimPromotionResult>(
  functions,
  "claimPromotion",
);

/**
 * One-off read of the hackathon's sponsor perks (public metadata; codes never live on this doc)
 *
 * @param dbCollectionName - firestore collection name for the hackathon
 * @returns the promotions array, or [] when the doc has none
 */
export async function fetchPromotions(dbCollectionName: string): Promise<Promotion[]> {
  const snap = await getDoc(doc(db, "Hackathons", dbCollectionName));
  const promotions = (snap.data() as Hackathon | undefined)?.promotions;
  return Array.isArray(promotions) ? promotions : [];
}

/**
 * Asks the claimPromotion function for one code; the same hacker always gets the same code back
 *
 * @param dbCollectionName - firestore collection name for the hackathon
 * @param promotionId - the promotion's id (see promotionKey in lib/promotions)
 * @returns the function's result; see lib/firebase/types/promotions.ts
 */
export async function claimPromotion(
  dbCollectionName: string,
  promotionId: string,
): Promise<ClaimPromotionResult> {
  const { data } = await claimPromotionCallable({ dbCollectionName, promotionId });
  return data;
}
