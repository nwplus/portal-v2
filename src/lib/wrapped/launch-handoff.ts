/**
 * One-shot flag marking a deck navigation that should play the launch fly-up.
 *
 * The banner arms it right before navigating; the deck route's loader consumes it.
 * Module state (not storage) on purpose: a refresh lands on the deck directly, with
 * no banner in sight, so the fly-up must not replay.
 */

let armed = false;

export function armLaunchHandoff(): void {
  armed = true;
}

export function consumeLaunchHandoff(): boolean {
  const wasArmed = armed;
  armed = false;
  return wasArmed;
}
