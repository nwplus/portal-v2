import type { Stamp } from "@/lib/firebase/types/stamps";

/**
 * Points (and raffle entries) a stamp is worth. Anything other than a finite number >= 0 counts as 1,
 * so stamps created before points existed are worth 1
 */
export function stampPointValue(stamp: Pick<Stamp, "points">): number {
  const { points } = stamp;
  return typeof points === "number" && Number.isFinite(points) && points >= 0
    ? Math.floor(points)
    : 1;
}

/**
 * A hacker's points for one hackathon: the value of each distinct unlocked stamp (0 if the stamp
 * doc no longer exists) plus their CTF solve points. admin-v2 implements the same rule.
 *
 * @param unlockedStampIds - stamp IDs unlocked for the hackathon
 * @param allStamps - every stamp, whatever its `hackathon` field says
 * @param ctfSolves - the hacker's CTF solves for the hackathon
 */
export function hackerPoints(
  unlockedStampIds: string[],
  allStamps: Pick<Stamp, "_id" | "points">[],
  ctfSolves: { points?: unknown }[],
): number {
  const stampsById = new Map(allStamps.map((stamp) => [stamp._id, stamp]));

  let total = 0;
  for (const id of new Set(unlockedStampIds)) {
    const stamp = stampsById.get(id);
    if (stamp) total += stampPointValue(stamp);
  }
  for (const { points } of ctfSolves) {
    if (typeof points === "number" && Number.isFinite(points)) total += points;
  }
  return total;
}
