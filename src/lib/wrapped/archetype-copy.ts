import type { ArchetypeId } from "@/lib/firebase/types/wrapped";
import { ARCHETYPE_RULES } from "@/lib/wrapped/archetype-rules";

/**
 * Archetype wording, keyed by id.
 *
 * The deck doc carries only the `ArchetypeId` — label and description live here on
 * purpose, so copy can be reworded by shipping the frontend without re-running the
 * batch script over every hacker.
 *
 * Every label reads "The ___", `ANCHOR` included: its id has no `THE_` prefix, its label does.
 */
/** The archetype every hacker falls back to — the deck must never render a blank one. */
export const DEFAULT_ARCHETYPE: ArchetypeId = "THE_WARRIOR";

const {
  veteranMinEvents,
  anchorMinShare,
  speedrunnerMinShare,
  earlyBirdWindowMinutes,
  finisherWindowMinutes,
} = ARCHETYPE_RULES;

/** 4 → "4th". */
function ordinal(n: number): string {
  const teen = n % 100 >= 11 && n % 100 <= 13;
  const suffix = teen ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${suffix}`;
}

const percent = (share: number) => `${Math.round(share * 100)}%`;

/**
 * Each description says what earned the archetype, with the rule's own numbers from
 * `ARCHETYPE_RULES`, so the copy can't drift from the script that assigns it.
 */
export const ARCHETYPE_COPY: Record<ArchetypeId, { label: string; description: string }> = {
  THE_PRIZEWINNER: {
    label: "The Prizewinner",
    description:
      "The judges saw it too. You built something worth a prize, and now it's on the record.",
  },
  THE_VETERAN: {
    label: "The Veteran",
    description: `This is at least your ${ordinal(veteranMinEvents)} nwPlus hackathon. You've watched this place grow up.`,
  },
  ANCHOR: {
    label: "The Anchor",
    description: `You pushed the most commits on your team, at least ${percent(anchorMinShare)} of them. When the repo moved, it was usually you.`,
  },
  THE_LONE_WOLF: {
    label: "The Lone Wolf",
    description: "A team of one. Every idea, commit and bug fix in that project was yours.",
  },
  THE_SPEEDRUNNER: {
    label: "The Speedrunner",
    description: `Your last commit landed before ${percent(speedrunnerMinShare)} of hackers'. You shipped while others were still debugging.`,
  },
  THE_EARLY_BIRD: {
    label: "The Early Bird",
    description: `Checked in within ${earlyBirdWindowMinutes} minutes of doors opening, before most people had found a seat.`,
  },
  THE_FINISHER: {
    label: "The Finisher",
    description: `Your final commit landed in the last ${finisherWindowMinutes} minutes before the deadline. Clutch.`,
  },
  THE_NIGHT_OWL: {
    label: "The Night Owl",
    description: "Still up for the midnight snack. Your best work happens after dark.",
  },
  THE_ORIGIN_STORY: {
    label: "The Origin Story",
    description: "Your first nwPlus hackathon. Every veteran started exactly where you are.",
  },
  THE_REGULAR: {
    label: "The Regular",
    description:
      "A workshop, an activity and a meal: you did the whole hackathon, not just the hacking.",
  },
  THE_WARRIOR: {
    label: "The Warrior",
    description:
      "You checked in, built something and saw it through. Plenty of people sign up; you showed up.",
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
 * @param id - the archetype id from a `WrappedDoc`
 * @returns the matching copy, or The Warrior's
 */
export function archetypeCopy(id: ArchetypeId | null | undefined): {
  label: string;
  description: string;
} {
  return ARCHETYPE_COPY[id as ArchetypeId] ?? ARCHETYPE_COPY[DEFAULT_ARCHETYPE];
}
