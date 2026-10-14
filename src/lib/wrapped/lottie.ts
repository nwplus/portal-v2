import type { AnimationItem } from "lottie-web";

/**
 * Helpers for retexting the After Effects comps that sit on top of Wrapped's videos.
 *
 * Every comp is 1080x1920, like the stage, and draws its text in HK Grotesk, which we
 * don't serve — `withWebfont` repoints it at Hanken Grotesk 800 (loaded in styles.css).
 */

export const LOTTIE_FONT_FAMILY = "Hanken Grotesk";
export const LOTTIE_FONT_WEIGHT = "800";

type LottieFont = { fFamily: string; fWeight: string; fStyle: string };

/**
 * Draws the comp's text with the webfont instead of whatever After Effects baked, and
 * drops source-text expressions (see below).
 *
 * Baked glyph outlines (`chars`) only cover the placeholder strings' characters, so a
 * hacker's own text would render with gaps; dropping them makes lottie-web fall back to
 * the font. lottie-web derives CSS weight from `fStyle` words and doesn't know
 * "ExtraBold" (it'd fall to 400), but an explicit `fWeight` wins — so set that and clear
 * the style.
 */
export function withWebfont<
  T extends {
    fonts?: { list?: LottieFont[] };
    chars?: unknown[];
    layers?: { t?: { d?: { x?: string } } }[];
  },
>(data: T): T {
  data.chars = undefined;
  // A source-text expression recomputes the text every frame, overriding the hacker's
  // value — and early-submission's reads a `.hours` layer the comp doesn't ship, so it
  // throws. The text is always ours to set, so expressions go.
  for (const layer of data.layers ?? []) {
    if (layer.t?.d?.x) layer.t.d.x = undefined;
  }
  for (const font of data.fonts?.list ?? []) {
    font.fFamily = LOTTIE_FONT_FAMILY;
    font.fWeight = LOTTIE_FONT_WEIGHT;
    font.fStyle = "";
  }
  return data;
}

/**
 * The bits of lottie-web's internals we reach into. `updateDocumentData` is the supported
 * way to retext a layer, but neither it nor `renderer.elements` is in the published types.
 */
type TextElement = { updateDocumentData: (documentData: { t: string }, index: number) => void };
type AnimationInternals = {
  animationData: { layers: { nm: string }[] };
  renderer: { elements: (TextElement | undefined)[] };
};

/**
 * Retext one layer by its After Effects name.
 *
 * `renderer.elements` is index-parallel to `animationData.layers`, so the layer name is
 * enough to find the element. The `0` is the text-document keyframe index; these layers
 * each hold exactly one.
 */
export function setLayerText(animation: AnimationItem, layerName: string, text: string) {
  const internals = animation as unknown as AnimationInternals;
  const index = internals.animationData.layers.findIndex((layer) => layer.nm === layerName);
  if (index === -1) {
    console.warn(`[wrapped] no layer named ${layerName}`);
    return;
  }
  internals.renderer.elements[index]?.updateDocumentData({ t: text }, 0);
}
