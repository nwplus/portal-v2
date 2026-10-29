/**
 * The 7 stamp reveal clips, keyed by stamp id.
 *
 * Each stamp's After Effects comp was exported as a 1080x1000 QuickTime with an
 * alpha channel, then transcoded to:
 * - `{id}.mp4` — HEVC with alpha (`hevc_videotoolbox`, `hvc1` tag) for Safari and
 *   Chromium with hardware HEVC; transparency preserved.
 * - `{id}-fallback.mp4` — H.264, opaque, composited over the slot colour
 *   (`#c9b8f5`) for browsers without HEVC-alpha (e.g. Firefox); visually seamless
 *   inside the slot circle.
 * - `{id}.png` — the last frame, used as the video poster, the loading state, and
 *   the static share-export image (video frames can't be rasterised by
 *   `html-to-image`).
 *
 * The stamp id IS the kebab-cased MOV filename — the Firestore stamps must use
 * these ids for the map to resolve.
 */
export interface StampVideoFiles {
  /** HEVC with alpha, first `<source>`. */
  mp4: string;
  /** H.264 opaque fallback, second `<source>`. */
  fallback: string;
  /** Last-frame still: poster, loading state, export image. */
  poster: string;
}

const ASSETS = "/assets/wrapped/stamps";

const STAMP_IDS = [
  "behind-the-mind-of-a-product-designer",
  "give-it-a-memory",
  "give-your-app-superpowers",
  "how-do-i-even-start",
  "make-it-exist",
  "prompt-to-prototype",
  "vibe-responsibily",
] as const;

export type StampVideoId = (typeof STAMP_IDS)[number];

export const STAMP_MOVS: Record<StampVideoId, StampVideoFiles> = Object.fromEntries(
  STAMP_IDS.map((id) => [
    id,
    {
      mp4: `${ASSETS}/${id}.mp4`,
      fallback: `${ASSETS}/${id}-fallback.mp4`,
      poster: `${ASSETS}/${id}.png`,
    },
  ]),
) as Record<StampVideoId, StampVideoFiles>;

/** Resolves a wrapped stamp to its clip files, or null for unknown (legacy) ids. */
export function stampVideo(stampId: string): StampVideoFiles | null {
  return (STAMP_MOVS as Record<string, StampVideoFiles>)[stampId] ?? null;
}
