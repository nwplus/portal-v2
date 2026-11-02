/**
 * The archetype thresholds, shared by the batch script that assigns archetypes
 * (`wrapped/calc.ts` `assignArchetype`) and the copy that describes them
 * (`archetype-copy.ts`), so a hacker is never told a number the rule didn't use.
 *
 * Import-free on purpose: `wrapped/` imports this file by relative path under Node.
 */
export const ARCHETYPE_RULES = {
  /** THE_VETERAN: nwPlus hackathons attended, this one included. */
  veteranMinEvents: 4,
  /** ANCHOR: the least share of the team's commits, on top of having the most. */
  anchorMinShare: 0.5,
  /** THE_SPEEDRUNNER: the least share of hackers whose last commit came later. */
  speedrunnerMinShare: 0.8,
  /** THE_EARLY_BIRD: the most minutes after check-in opened. */
  earlyBirdWindowMinutes: 20,
  /** THE_FINISHER: the most minutes before the deadline of the last commit. */
  finisherWindowMinutes: 3,
} as const;
