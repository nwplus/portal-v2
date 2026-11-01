import type { CtfChallenge, CtfSolve, SubmitCtfFlagResult } from "@/lib/firebase/types/ctf";

export type ChallengeCardState = "comingSoon" | "open" | "soldOut" | "closed" | "solved";

export type SubmitFeedback = { tone: "success" | "info" | "error"; message: string };

const pointsLabel = (points: number) => `${points} point${points === 1 ? "" : "s"}`;

/**
 * A challenge with no title hasn't been opened yet, so its content isn't in Firestore
 */
export function getChallengeCardState(
  challenge: Pick<CtfChallenge, "isOpen" | "title" | "claimedCount" | "totalFlags">,
  solved: boolean,
): ChallengeCardState {
  if (solved) return "solved";
  if (!challenge.title) return "comingSoon";
  if (!challenge.isOpen) return "closed";
  if (challenge.claimedCount >= challenge.totalFlags) return "soldOut";
  return "open";
}

export function describeCardStatus(
  state: ChallengeCardState,
  challenge: Pick<CtfChallenge, "claimedCount" | "totalFlags">,
  solve?: Pick<CtfSolve, "rank" | "points">,
): string {
  switch (state) {
    case "solved":
      return solve ? `Rank #${solve.rank} · +${pointsLabel(solve.points)}` : "Solved";
    case "open":
      return `${challenge.claimedCount}/${challenge.totalFlags} claimed`;
    case "soldOut":
      return "All flags claimed";
    case "closed":
      return "Closed";
    case "comingSoon":
      return "Coming soon";
  }
}

export function describeSubmitResult(
  result: SubmitCtfFlagResult,
  titles: Record<string, string>,
): SubmitFeedback {
  switch (result.status) {
    case "solved":
      return {
        tone: "success",
        message: `Rank #${result.rank} on ${titles[result.challengeId] ?? "this challenge"} — +${pointsLabel(result.points)}. Stamp unlocked!`,
      };
    case "alreadySolved":
      return {
        tone: "info",
        message: `You've already solved ${titles[result.challengeId] ?? "this challenge"} (rank #${result.rank}).`,
      };
    case "invalid":
      return { tone: "error", message: "That's not a valid flag." };
    case "claimed":
      return {
        tone: "error",
        message: "That flag has already been redeemed. Each flag works once.",
      };
    case "closed":
      return { tone: "error", message: "That challenge isn't open right now." };
  }
}

/**
 * The Firebase JS SDK reports callable errors as `functions/<code>`
 */
export function describeSubmitError(code: string | undefined): string {
  switch (code?.replace(/^functions\//, "")) {
    case "resource-exhausted":
      return "Too many wrong attempts. Try again in a few minutes.";
    case "failed-precondition":
      return "The CTF is open to hackers who've RSVP'd.";
    default:
      return "Something went wrong. Try again.";
  }
}

export function summarizeSolves(solves: Pick<CtfSolve, "points">[]): {
  points: number;
  solved: number;
} {
  return {
    points: solves.reduce((sum, solve) => sum + solve.points, 0),
    solved: solves.length,
  };
}

/**
 * Flags look like `hackcamp2026{...}`: the hackathon slug and year
 */
export function flagPlaceholder(activeHackathon: string, hackathonYear: number): string {
  return `${activeHackathon}${hackathonYear}{...}`;
}

export function sortChallenges<T extends Pick<CtfChallenge, "order">>(challenges: T[]): T[] {
  return [...challenges].sort((a, b) => a.order - b.order);
}
