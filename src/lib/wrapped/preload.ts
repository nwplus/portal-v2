/**
 * Fetches and decodes images ahead of the elements that show them, so a slide's entrance
 * doesn't play over half-drawn artwork.
 *
 * Resolves once every image has loaded and decoded. A failed or undecodable image counts
 * as done: a missing file must not hold the deck, which shows the slide without it.
 */
export function preloadImages(urls: readonly string[]): Promise<void> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const image = new Image();
          // Handlers go on before `src`, so an image already in cache can't fire early.
          image.onload = () => {
            image
              .decode()
              .catch(() => {})
              .then(() => resolve());
          };
          image.onerror = () => resolve();
          image.src = url;
        }),
    ),
  ).then(() => {});
}

/**
 * Loads a webfont face, resolving (never rejecting) once it's usable or has failed.
 *
 * @param font - a CSS `font` shorthand naming the face, e.g. `700 141px "Hanken Grotesk"`
 */
export function preloadFont(font: string): Promise<void> {
  return document.fonts
    .load(font)
    .then(() => {})
    .catch(() => {});
}
