import { displayNames } from "@/lib/wrapped/tech-names";
import { textWidth } from "@/lib/wrapped/text-width";

export { techDisplayName } from "@/lib/wrapped/tech-names";

/**
 * What the tech-stack slide shows: a project's tools, tidied for display and fitted to the
 * comp's slots.
 *
 * The script now stores display names, at most four, with a detected AI tool among them
 * (`buildTechStack`). Names are still tidied here (`tech-names.ts`) so docs written before
 * that read the same. Kept pure, away from `scenes.ts`, so it's testable.
 */

/**
 * Width a name may take, in comp pixels. Names start at x≈720, and a tall phone stretches the
 * stage so its sides are cropped: 390x844 shows up to x≈983.
 */
const NAME_MAX_WIDTH = 250;
/** The comp's size for these names, as drawn: 100 on layers scaled to 50%. */
const NAME_SIZE = 50;
const NAME_MIN_SIZE = 30;
const LAYER_SCALE = 0.5;
/** The comps draw their text at this weight, whatever After Effects baked (see `withWebfont`). */
const NAME_WEIGHT = 800;

const nameWidth = (line: string, size: number) => textWidth(line, size, NAME_WEIGHT);
const widestLine = (lines: string[]) =>
  Math.max(0, ...lines.map((line) => nameWidth(line, NAME_SIZE)));

/** Splits a name that won't fit on one line at its most even space, hyphen or slash. */
function breakName(name: string): string[] {
  if (nameWidth(name, NAME_SIZE) <= NAME_MAX_WIDTH) return [name];
  let best = [name];
  for (const { index } of name.matchAll(/[\s/-]/g)) {
    const first = name.slice(0, name[index] === " " ? index : index + 1);
    const split = [first, name.slice(index + 1)];
    if (widestLine(split) < widestLine(best)) best = split;
  }
  return best;
}

/** Past the smallest size there's nothing left to give, so the line is cut. */
function clampLine(line: string): string {
  if (nameWidth(line, NAME_MIN_SIZE) <= NAME_MAX_WIDTH) return line;
  let kept = line;
  while (kept && nameWidth(`${kept}…`, NAME_MIN_SIZE) > NAME_MAX_WIDTH) kept = kept.slice(0, -1);
  return `${kept}…`;
}

export type FittedTechStack = {
  /** One entry per filled slot; `\r` is After Effects' line break. */
  names: string[];
  /** The font size for every slot, in the layers' own units. */
  layerSize: number;
};

/**
 * Fits the first `slots` tools to the slide: at most two lines each, all at one size so the
 * rows still read as a list.
 *
 * @param stack - the project's tools, as stored
 * @param slots - how many tools the comp can show
 * @returns the text and shared font size for the comp's text layers
 */
export function fitTechStack(stack: string[], slots: number): FittedTechStack {
  const lines = displayNames(stack)
    .slice(0, slots)
    .map((name) => breakName(name).map(clampLine));
  const widest = widestLine(lines.flat());
  const fitted = widest > 0 ? (NAME_SIZE * NAME_MAX_WIDTH) / widest : NAME_SIZE;
  const size = Math.floor(Math.min(NAME_SIZE, Math.max(NAME_MIN_SIZE, fitted)));
  return {
    names: lines.map((name) => name.join("\r")),
    layerSize: size / LAYER_SCALE,
  };
}
