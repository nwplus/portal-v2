/**
 * Local persistence for the "your Wrapped is ready" dashboard banner.
 *
 * The banner is a one-time nudge, so its dismissal is a per-browser convenience rather
 * than account state — localStorage, following the hand-rolled pattern in
 * `my-ticket.tsx` (guarded access, try/catch, no throwing on a blocked store).
 *
 * Keyed per event so a new hackathon's banner is not silently suppressed by last
 * year's dismissal.
 */

function bannerKey(eventId: string): string {
  return `wrappedBannerDismissed:${eventId}`;
}

/**
 * Whether the banner has already been dismissed for this event in this browser.
 *
 * Returns true on a read failure: a browser that cannot tell us the banner was
 * dismissed should not be answered by showing it again on every page load.
 *
 * @param eventId - the hackathon's firestore collection name
 */
export function isWrappedBannerDismissed(eventId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(bannerKey(eventId)) === "1";
  } catch {
    return true;
  }
}

/**
 * Stops the banner for this event.
 *
 * Called from both triggers the banner retires on: the close button, and the deck
 * itself being opened.
 *
 * @param eventId - the hackathon's firestore collection name
 */
export function dismissWrappedBanner(eventId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(bannerKey(eventId), "1");
  } catch (error) {
    console.error("Failed to persist wrapped banner dismissal", error);
  }
}
