/**
 * How wide text sets in Hanken Grotesk, without needing the DOM or the font to have loaded, so
 * fitting stays a pure function that runs before a slide is built.
 *
 * Advances for ASCII 32-126 in 1/1000 em, read from Google Fonts' v12 files. Kerning is
 * ignored; it barely moves these strings and mostly tightens them.
 */
const ADVANCES = {
  600: [
    260, 248, 357, 696, 560, 739, 696, 186, 259, 259, 399, 560, 240, 327, 240, 420, 560, 560, 560,
    560, 560, 560, 560, 560, 560, 560, 240, 240, 560, 560, 560, 515, 874, 661, 608, 708, 676, 580,
    560, 734, 688, 258, 554, 653, 501, 851, 685, 748, 559, 782, 607, 572, 585, 657, 666, 972, 660,
    617, 598, 286, 460, 286, 602, 463, 306, 544, 579, 521, 579, 541, 344, 520, 559, 239, 239, 550,
    273, 838, 559, 574, 579, 579, 420, 471, 360, 559, 530, 752, 534, 530, 471, 268, 267, 268, 560,
  ],
  800: [
    260, 256, 376, 693, 560, 731, 705, 199, 296, 296, 400, 560, 240, 327, 240, 421, 560, 560, 560,
    560, 560, 560, 560, 560, 560, 560, 240, 240, 560, 560, 560, 514, 873, 686, 615, 711, 671, 575,
    555, 737, 698, 269, 557, 672, 507, 862, 694, 747, 564, 789, 616, 579, 583, 658, 677, 987, 679,
    632, 613, 313, 473, 313, 652, 522, 319, 548, 570, 524, 570, 542, 353, 525, 570, 252, 252, 569,
    282, 848, 570, 571, 570, 570, 433, 472, 374, 570, 539, 757, 549, 539, 470, 297, 276, 297, 560,
  ],
} as const;

const FIRST_CHAR = 32;
/** Anything outside the table: accents, emoji, CJK, "…". On the wide side, to err towards fitting. */
const OTHER_ADVANCE = 750;

/**
 * @param text - one line of text
 * @param size - font size in pixels
 * @param weight - the font weight it's set in
 * @returns its width in pixels
 */
export function textWidth(text: string, size: number, weight: keyof typeof ADVANCES): number {
  let total = 0;
  for (const char of text) {
    total += ADVANCES[weight][(char.codePointAt(0) ?? 0) - FIRST_CHAR] ?? OTHER_ADVANCE;
  }
  return (total / 1000) * size;
}
