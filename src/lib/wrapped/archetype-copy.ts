import type { ArchetypeId } from "@/lib/firebase/types/wrapped";

/**
 * Archetype wording, keyed by id.
 *
 * The deck doc carries only the `ArchetypeId` — label and description live here on
 * purpose, so copy can be reworded by shipping the frontend without re-running the
 * batch script over every hacker.
 *
 * `ANCHOR` keeps its article-less label; the other ten read "The ___".
 */
/** The archetype every hacker falls back to — the deck must never render a blank one. */
export const DEFAULT_ARCHETYPE: ArchetypeId = "THE_WARRIOR";

export const ARCHETYPE_COPY: Record<ArchetypeId, { label: string; description: string }> = {
  THE_PRIZEWINNER: {
    label: "The Prizewinner",
    description: "Won a prize. Big W.",
  },
  THE_VETERAN: {
    label: "The Veteran",
    description: "A living legend. You've basically seen it all.",
  },
  ANCHOR: {
    label: "Anchor",
    description: "The team goes as far as you take them. You're the glue.",
  },
  THE_LONE_WOLF: {
    label: "The Lone Wolf",
    description: "No team, no problem. Built the whole thing solo.",
  },
  THE_SPEEDRUNNER: {
    label: "The Speedrunner",
    description: "Submitted with hours to spare. Deadline? What deadline?",
  },
  THE_EARLY_BIRD: {
    label: "The Early Bird",
    description: "First in the door. The coffee wasn't even ready.",
  },
  THE_FINISHER: {
    label: "The Finisher",
    description: "Made it to the end and shipped with minutes to spare.",
  },
  THE_NIGHT_OWL: {
    label: "The Night Owl",
    description: "Midnight snack claimed. You operate after dark.",
  },
  THE_ORIGIN_STORY: {
    label: "The Origin Story",
    description: "Every legend has a first chapter. This is yours.",
  },
  THE_REGULAR: {
    label: "The Regular",
    description: "Workshops, activities, all of it. You showed up for everything.",
  },
  THE_WARRIOR: {
    label: "The Warrior",
    description: "You're a warrior for surviving the hackathon.",
  },
};

/**
 * Copy for an archetype id, tolerating anything the doc actually contains.
 *
 * A membership check rather than `?? DEFAULT`: the deck is driven by a document written
 * by a separate batch job, so the id can be absent, empty, or a stale value this build
 * has never heard of. Only `null`/`undefined` would be caught by `??`, and every other
 * miss would destructure `undefined` — on the one slide that renders for every hacker.
 *
 * @param id - the archetype id from a `WrappedDoc` or `WrappedShareCard`
 * @returns the matching copy, or The Warrior's
 */
export function archetypeCopy(id: ArchetypeId | null | undefined): {
  label: string;
  description: string;
} {
  return ARCHETYPE_COPY[id as ArchetypeId] ?? ARCHETYPE_COPY[DEFAULT_ARCHETYPE];
}
