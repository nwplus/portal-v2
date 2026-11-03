import type { AnimationItem, SVGRendererConfig } from "lottie-web";

/**
 * Helpers for retexting the After Effects comps that sit on top of Wrapped's videos.
 *
 * Every comp is 1080x1920, like the stage, and draws its text in HK Grotesk, which we
 * don't serve — `withWebfont` repoints it at Hanken Grotesk 800 (loaded in styles.css).
 */

export const LOTTIE_FONT_FAMILY = "Hanken Grotesk";
export const LOTTIE_FONT_WEIGHT = "800";

/**
 * SVG renderer settings for every comp the deck plays.
 *
 * `filterSize` is the region an effect filter may paint, as a fraction of the layer's
 * bounding box. lottie-web's SVG default is the box itself (0%/100%), which cuts a glow
 * (a Drop Shadow at distance 0, e.g. on the GitHub and prizes numbers) off in a
 * hard rectangle at the glyphs' edges. One box-width of margin on every side holds the
 * blur even for a single digit.
 */
export const LOTTIE_RENDERER_SETTINGS: SVGRendererConfig = {
  preserveAspectRatio: "xMidYMid slice",
  filterSize: { x: "-100%", y: "-100%", width: "300%", height: "300%" },
};

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
 * A layer's new text, and optionally a font size in comp pixels for text that would
 * outgrow the comp's own size.
 */
export type LayerText = string | { text: string; size: number };

/**
 * Where a comp's image assets live. Exports reference them as `images/img_0.png`, which
 * lottie-web would resolve against the page; with `assetsPath` set it takes the file name
 * from the comp's own folder instead.
 */
export function lottieAssetsPath(src: string): string {
  return src.slice(0, src.lastIndexOf("/") + 1);
}

/** A text document: its text, font size and leading. */
type TextDocument = { t: string; s: number; lh: number };

/**
 * The bits of lottie-web's internals we reach into. `updateDocumentData` is the supported
 * way to retext a layer, but neither it nor `renderer.elements` is in the published types.
 */
type TextElement = {
  updateDocumentData: (documentData: Partial<TextDocument>, index: number) => void;
};
type AnimationInternals = {
  animationData: { layers: { nm: string; t?: { d: { k: { s: TextDocument }[] } } }[] };
  renderer: { elements: (TextElement | undefined)[] };
};

/**
 * Retext one layer by its After Effects name.
 *
 * `renderer.elements` is index-parallel to `animationData.layers`, so the layer name is
 * enough to find the element. The `0` is the text-document keyframe index; these layers
 * each hold exactly one. A new size scales the leading with it, so a multi-line layer
 * keeps its proportions.
 */
export function setLayerText(animation: AnimationItem, layerName: string, value: LayerText) {
  const internals = animation as unknown as AnimationInternals;
  const index = internals.animationData.layers.findIndex((layer) => layer.nm === layerName);
  if (index === -1) {
    console.warn(`[wrapped] no layer named ${layerName}`);
    return;
  }
  const element = internals.renderer.elements[index];
  if (typeof value === "string") {
    element?.updateDocumentData({ t: value }, 0);
    return;
  }
  const baked = internals.animationData.layers[index].t?.d.k[0]?.s;
  element?.updateDocumentData(
    {
      t: value.text,
      s: value.size,
      ...(baked && { lh: (baked.lh / baked.s) * value.size }),
    },
    0,
  );
}
