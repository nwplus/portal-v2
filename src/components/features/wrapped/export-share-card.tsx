import { COMP_HEIGHT, COMP_WIDTH } from "@/components/features/wrapped/comp-canvas";
import { ShareCard } from "@/components/features/wrapped/share-card";
import type { WrappedDoc } from "@/lib/firebase/types/wrapped";
import { buildShareCardData } from "@/lib/wrapped/share-card";
import { toBlob } from "html-to-image";
import { createRoot } from "react-dom/client";

/**
 * Renders the share card to a 1080x1920 PNG, for the summary's share sheet.
 *
 * The card is mounted offscreen at full size, given its fonts and images, then
 * rasterised by html-to-image.
 */

/** Stands in for any image html-to-image can't fetch. */
const BLANK_IMAGE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
/** The card's type: Hanken Grotesk at every weight it sets. */
const CARD_FONTS = [600, 700, 800, 900].map((weight) => `${weight} 48px "Hanken Grotesk"`);

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/** The card's one webfont, every subset Google serves, at the weights it sets. */
const CARD_FONT_CSS =
  "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@600..900&display=block";

async function fetchAsDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} fetching ${url}`);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

let fontCss: Promise<string> | null = null;

/**
 * The card's `@font-face` rules with every font file inlined, built once per visit.
 *
 * Built here rather than left to html-to-image, which swallows a failed font fetch and
 * keeps the remote URL — and a rasterised SVG can't load one, so the card would save in
 * a fallback serif. A file that won't inline throws instead, so the sheet offers
 * "Try again" rather than a wrong-looking image.
 */
function cardFontCss(): Promise<string> {
  fontCss ??= (async () => {
    const css = await (await fetch(CARD_FONT_CSS)).text();
    let embedded = css;
    for (const url of new Set(css.match(/https:[^)\s]+/g) ?? [])) {
      embedded = embedded.replaceAll(url, await fetchAsDataUrl(url));
    }
    if (!embedded.includes("@font-face") || /url\(\s*['"]?https?:/.test(embedded)) {
      throw new Error("couldn't inline the card's font");
    }
    return embedded;
  })();
  fontCss.catch(() => {
    fontCss = null;
  });
  return fontCss;
}

/** A fixed-size host parked offscreen, so layout runs at comp size without being seen. */
function offscreenHost() {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, {
    position: "fixed",
    left: "-20000px",
    top: "0",
    width: `${COMP_WIDTH}px`,
    height: `${COMP_HEIGHT}px`,
    pointerEvents: "none",
  });
  document.body.append(host);
  return host;
}

export async function renderShareCard(doc: WrappedDoc): Promise<Blob> {
  const host = offscreenHost();
  const root = createRoot(host);
  try {
    // Rendered asynchronously, then waited for: callers are often inside an effect, where
    // React won't flush a render synchronously.
    root.render(<ShareCard data={buildShareCardData(doc)} />);
    let comp: HTMLElement | null = null;
    for (let frame = 0; frame < 60 && !comp; frame++) {
      await nextFrame();
      comp = host.querySelector<HTMLElement>("[data-wrapped-comp]");
    }
    if (!comp) throw new Error("the share card never mounted");

    await Promise.all([
      ...CARD_FONTS.map((font) => document.fonts.load(font).catch(() => {})),
      ...Array.from(host.querySelectorAll("img"), (img) => img.decode().catch(() => {})),
    ]);
    await nextFrame();

    // Pinned to the host's corner at full size: the comp normally centres and scales
    // itself, which the capture would otherwise inherit.
    Object.assign(comp.style, { transform: "none", left: "0", top: "0" });

    const options = {
      width: COMP_WIDTH,
      height: COMP_HEIGHT,
      pixelRatio: 1,
      // The card's base colour lives on the scaling wrapper, outside the capture.
      backgroundColor: comp.parentElement
        ? getComputedStyle(comp.parentElement).backgroundColor
        : undefined,
      imagePlaceholder: BLANK_IMAGE,
      fontEmbedCSS: await cardFontCss(),
    };
    // html-to-image draws an SVG snapshot of the card, which decodes its fonts and images
    // itself, and a first draw can land before it has (WebKit leaves images blank). A
    // throwaway first pass warms them up, so the kept second pass has them.
    await toBlob(comp, options);
    const blob = await toBlob(comp, options);
    if (!blob) throw new Error("the share card rendered no image");
    return blob;
  } finally {
    root.unmount();
    host.remove();
  }
}

/**
 * Hands the image to the hacker: the system share sheet on phones (where "Save Image"
 * lands it in the camera roll), a plain download everywhere else.
 *
 * Call it straight from the tap, with the image already rendered: iOS only opens the
 * share sheet while the tap's user activation is still live. In-app browsers (Instagram,
 * Discord) can silently refuse both, which is why the sheet also offers press-and-hold.
 */
export async function saveImage(file: File): Promise<void> {
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  if (isTouch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (error) {
      // Dismissing the sheet is a choice, not a failure.
      if (error instanceof DOMException && error.name === "AbortError") return;
      // Anything else falls through to a download.
    }
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  // Revoking too early cancels the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
