import type {
  ClaimPromotionResult,
  ClaimedPromotion,
  Promotion,
} from "@/lib/firebase/types/promotions";

/**
 * URL-safe slug, so a promotion without an explicit id can still be addressed by its sponsor name
 * Mirrors Functions-new src/promotions/keys.ts
 */
export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/**
 * The id a promotion is claimed under: its `id` when set, otherwise a slug of the sponsor
 */
export function promotionKey(promotion: Pick<Promotion, "id" | "sponsor">): string {
  return promotion.id?.trim() || slugify(promotion.sponsor ?? "");
}

/**
 * What to call the perk: the sponsor when set, otherwise the id with dashes as spaces, title-cased
 */
export function sponsorName(promotion: Pick<Promotion, "id" | "sponsor">): string {
  const sponsor = promotion.sponsor?.trim();
  if (sponsor) return sponsor;
  return promotionKey(promotion)
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export interface Perk {
  promotionId: string;
  promotion: Promotion;
  claim?: ClaimedPromotion;
}

/**
 * The perks worth rendering: every promotion that's available, plus any the hacker already holds
 * (even if it has since been turned off). An empty list means My Perks should not render
 */
export function getPerks(
  promotions: Promotion[] | undefined,
  claimed: Record<string, ClaimedPromotion> | undefined,
): Perk[] {
  const perks: Perk[] = [];
  const seen = new Set<string>();

  for (const promotion of promotions ?? []) {
    if (!promotion || typeof promotion !== "object") continue;
    const promotionId = promotionKey(promotion);
    if (!promotionId || seen.has(promotionId)) continue;
    const claim = claimed?.[promotionId];
    if (promotion.available !== true && !claim) continue;
    seen.add(promotionId);
    perks.push({ promotionId, promotion, claim });
  }

  // Claims whose promotion was removed from the hackathon doc still belong to the hacker
  for (const claim of Object.values(claimed ?? {})) {
    if (!claim?.code || seen.has(claim.promotionId)) continue;
    seen.add(claim.promotionId);
    perks.push({
      promotionId: claim.promotionId,
      promotion: {
        id: claim.promotionId,
        sponsor: claim.sponsor,
        type: claim.type,
        instructions: claim.instructions,
        redemption_url: claim.redemption_url,
        available: false,
      },
      claim,
    });
  }

  return perks;
}

export type ClaimFeedback = {
  tone: "success" | "info" | "error";
  message: string;
};

export function describeClaimResult(result: ClaimPromotionResult, sponsor: string): ClaimFeedback {
  switch (result.status) {
    case "claimed":
      return { tone: "success", message: `Your ${sponsor} code is ready!` };
    case "alreadyClaimed":
      return { tone: "info", message: `You already have a ${sponsor} code.` };
    case "soldOut":
      return { tone: "error", message: `All ${sponsor} codes have been claimed.` };
    case "unavailable":
      return { tone: "error", message: `The ${sponsor} perk isn't available right now.` };
  }
}

/**
 * The Firebase JS SDK reports callable errors as `functions/<code>`
 */
export function describeClaimError(code: string | undefined): string {
  switch (code?.replace(/^functions\//, "")) {
    case "failed-precondition":
      return "Perks are available to hackers who've RSVP'd.";
    case "aborted":
      return "Codes are going fast. Try again.";
    case "unavailable":
    case "deadline-exceeded":
      return "We couldn't finish claiming your code. Try again; you won't get a duplicate.";
    default:
      return "Something went wrong. Try again.";
  }
}
