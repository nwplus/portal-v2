import type { WrappedStamp } from "@/lib/firebase/types/wrapped";

/**
 * The stamps slide's stampbook: every stamp of the event, collected or not.
 *
 * Which stamps were collected comes from the deck doc (`showedUp.stamps`, written by the
 * batch script). Everything shown — name, art, locked art — comes from `Stamps` as read
 * when the deck opens, so stamp edits after the run still reach the slide.
 */

/** One slot in the stampbook, ready to draw. */
export interface StampSlot {
  id: string;
  name: string;
  /** Printed on the page for every slot, collected or not. */
  lockedImgURL: string;
  /** The collected art, pasted over the locked art; null for a stamp not collected. */
  imgURL: string | null;
  collected: boolean;
}

/** The fields of `Stamps/{id}` the slide reads. */
export interface LiveStamp {
  id: string;
  name: string;
  imgURL?: string;
  lockedImgURL?: string;
  /** A `StampCategory`; orders the book. */
  category?: string;
  /** Hidden stamps appear only once collected, as in the stampbook. */
  isHidden?: boolean;
}

/** The slide's two books hold two rows of five each. */
export const STAMP_SLOT_LIMIT = 20;

/** What the stampbook shows for a stamp that has no locked art of its own. */
export const LOCKED_STAMP_FALLBACK = "/assets/stampbook/stamp-locked.svg";

/**
 * The book's sections, in order. `other` holds the CTF stamps (no stamp field marks a CTF
 * stamp; HackCamp2026's CTF stamps are its `other` ones). A stamp with no category, or one
 * deleted since the run, goes last with them.
 */
const CATEGORY_ORDER = ["preHackathonWorkshop", "dayOfActivity", "dayOfWorkshop"];

function categoryRank(category: string | undefined): number {
  const rank = CATEGORY_ORDER.indexOf(category ?? "");
  return rank === -1 ? CATEGORY_ORDER.length : rank;
}

/**
 * Builds the stampbook, by category (pre-hackathon workshops, activities, day-of
 * workshops, then CTF and anything else), alphabetical within each.
 *
 * A collected stamp missing from `live` (deleted since the run) keeps the doc's copy.
 * Past `STAMP_SLOT_LIMIT`, stamps not collected are dropped from the end of the book
 * first, so every collected stamp keeps a slot while there's room for it.
 *
 * @param collected - the doc's `showedUp.stamps`
 * @param live - the event's `Stamps`; null when they could not be read, which shows only
 *   the collected stamps, from the doc
 */
export function buildStampSlots(collected: WrappedStamp[], live: LiveStamp[] | null): StampSlot[] {
  const collectedIds = new Set(collected.map((stamp) => stamp.id));
  const liveById = new Map((live ?? []).map((stamp) => [stamp.id, stamp]));

  const slots: (StampSlot & { rank: number })[] = [];
  for (const stamp of live ?? []) {
    const isCollected = collectedIds.has(stamp.id);
    if (stamp.isHidden && !isCollected) continue;
    slots.push({
      id: stamp.id,
      name: stamp.name,
      lockedImgURL: stamp.lockedImgURL ?? LOCKED_STAMP_FALLBACK,
      imgURL: isCollected ? (stamp.imgURL ?? null) : null,
      collected: isCollected,
      rank: categoryRank(stamp.category),
    });
  }
  for (const stamp of collected) {
    if (liveById.has(stamp.id)) continue;
    slots.push({
      ...stamp,
      lockedImgURL: LOCKED_STAMP_FALLBACK,
      collected: true,
      rank: categoryRank(undefined),
    });
  }

  const sorted = slots
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        a.name.trim().localeCompare(b.name.trim(), "en", { sensitivity: "base" }),
    )
    .map(({ rank: _, ...slot }) => slot);
  return fitToLimit(sorted);
}

/** Drops uncollected slots from the end until the book fits, then cuts what's left over. */
function fitToLimit(slots: StampSlot[]): StampSlot[] {
  let excess = slots.length - STAMP_SLOT_LIMIT;
  if (excess <= 0) return slots;
  const kept = [...slots];
  for (let i = kept.length - 1; i >= 0 && excess > 0; i--) {
    if (!kept[i].collected) {
      kept.splice(i, 1);
      excess--;
    }
  }
  return kept.slice(0, STAMP_SLOT_LIMIT);
}
