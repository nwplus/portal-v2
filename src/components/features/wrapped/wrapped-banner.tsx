import { ROCKET_HEIGHT, ROCKET_WIDTH, RocketShip } from "@/components/features/wrapped/rocket-ship";
import { useHackathon } from "@/hooks/use-hackathon";
import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import { useWrappedReady } from "@/hooks/use-wrapped-ready";
import { useAuthStore } from "@/lib/stores/auth-store";
import { dismissWrappedBanner, isWrappedBannerDismissed } from "@/lib/wrapped/banner-dismissal";
import { armLaunchHandoff } from "@/lib/wrapped/launch-handoff";
import { fetchWrappedOptIn } from "@/services/socials";
import { fetchWrappedDoc } from "@/services/wrapped";
import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** How long the rocket takes to cross the banner, revealing it behind itself. */
const REVEAL_MS = 1600;
/** Exit: the banner flies off right, the page fades to the intro's sky, then the deck
    opens and the fly-up takes over there. */
const EXIT_MS = 500;

/** Ship size, as a fraction of its natural 510x696. */
const BANNER_ROCKET_SCALE = 0.07;

/** The banner rocket, rotated nose-first: its on-screen width, height, and the offset
    that centers the unrotated ship box inside that footprint. */
const BANNER_ROCKET_W = ROCKET_HEIGHT * BANNER_ROCKET_SCALE;
const BANNER_ROCKET_H = ROCKET_WIDTH * BANNER_ROCKET_SCALE;
const BANNER_ROCKET_OFFSET = ((ROCKET_HEIGHT - ROCKET_WIDTH) / 2) * BANNER_ROCKET_SCALE;

/** Both the reveal and the ship share this ease, so the edge and the nose stay locked. */
const REVEAL_EASE = "cubic-bezier(0.65, 0, 0.35, 1)";

/**
 * Dev-only opt-in (`VITE_FORCE_WRAPPED_BANNER=true`): shows the banner regardless of
 * release, deck, opt-in or dismissal, and launches into the `full` mock deck, so the
 * banner can be seen without seeding data. Off by default so dismissal behaves normally.
 */
const FORCE_BANNER = import.meta.env.DEV && import.meta.env.VITE_FORCE_WRAPPED_BANNER === "true";

/** The intro slide's sky, so the hand-off into the deck is seamless. */
const INTRO_SKY = "#1a1138";

/**
 * Sticky dashboard banner announcing the hacker's Wrapped, which launches into the deck.
 *
 * From the "Hacker Wrapped Sticky Banner" section of the New Portal (v2) Figma:
 *  1. a rocket crosses the top of the page, revealing the banner behind it;
 *  2. the banner's fill cycles through a yellow glow to draw the eye;
 *  3. on click the banner slides up and away, a rocket rises from the bottom of the
 *     screen, and the page fades into the deck's intro.
 *
 * Retires permanently on either the close button or the deck being opened (the deck
 * writes the same key on mount). Dismissal is per-browser localStorage, keyed per event.
 */
export function WrappedBanner() {
  const { activeHackathon } = useHackathon();
  const { dbCollectionName } = useHackathonInfo();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const isReleased = useWrappedReady();
  const navigate = useNavigate();

  // Starts hidden so the banner cannot flash in before we know it was dismissed.
  const [isDismissed, setIsDismissed] = useState(true);
  const [hasDeck, setHasDeck] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const launchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Don't navigate after the user has already left the page mid-launch.
  useEffect(() => () => clearTimeout(launchTimeoutRef.current), []);

  useEffect(() => {
    setIsDismissed(isWrappedBannerDismissed(dbCollectionName));
  }, [dbCollectionName]);

  // Only reads when the banner could actually show — no wasted read for hackers whose
  // event has not released, or who already dismissed it.
  useEffect(() => {
    if (!isAuthenticated || !user?.uid || !dbCollectionName || !isReleased || isDismissed) {
      setHasDeck(false);
      return;
    }

    let active = true;
    // Opted-out hackers are never nudged, even if a deck predating their opt-out is
    // still in Firestore — the deck route refuses them too, so a banner would 404.
    Promise.all([fetchWrappedDoc(dbCollectionName, user.uid), fetchWrappedOptIn(user.uid)])
      .then(([doc, isOptedIn]) => {
        if (active) setHasDeck(doc !== null && isOptedIn);
      })
      .catch((error) => console.error("Failed to check for wrapped deck", error));

    return () => {
      active = false;
    };
  }, [isAuthenticated, user?.uid, dbCollectionName, isReleased, isDismissed]);

  if (!FORCE_BANNER && (!hasDeck || (isDismissed && !isLaunching))) return null;

  const openDeck = () =>
    navigate({
      to: "/$activeHackathon/wrapped",
      params: { activeHackathon },
      ...(FORCE_BANNER ? { search: { mock: "full" } } : {}),
    });

  const handleDismiss = () => {
    dismissWrappedBanner(dbCollectionName);
    setIsDismissed(true);
  };

  const handleLaunch = () => {
    if (isLaunching) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      openDeck();
      return;
    }
    armLaunchHandoff();
    setIsLaunching(true);
    launchTimeoutRef.current = setTimeout(openDeck, EXIT_MS);
  };

  return (
    <>
      <div className="sticky top-0 z-40 overflow-hidden">
        {/* The banner and its rocket leave to the right together, clipped by the
            sticky container so the flight can't widen the page's scroll area. */}
        <div
          className="relative"
          style={
            isLaunching ? { animation: `wrapped-banner-exit ${EXIT_MS}ms ease-in both` } : undefined
          }
        >
          <div
            className="relative flex min-h-12 items-center justify-center gap-4 py-2 pr-12 pl-14 text-[#fff] text-sm md:pl-12"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #141414 0%, #4a2230 18%, #6b2633 38%, #9c8a2e 50%, #6b2633 62%, #4a2230 82%, #141414 100%)",
              backgroundSize: "200% 100%",
              animation: `wrapped-banner-reveal ${REVEAL_MS}ms ${REVEAL_EASE} both, wrapped-banner-light ${REVEAL_MS}ms ${REVEAL_EASE} both, wrapped-banner-glow 3s linear ${REVEAL_MS}ms alternate infinite`,
            }}
          >
            <p className="min-w-0 text-center">
              <span className="font-semibold">Your Wrapped has landed!</span>{" "}
              <span className="hidden text-[#fff]/85 sm:inline">
                Explore your hackathon journey
              </span>
            </p>
            <button
              type="button"
              onClick={handleLaunch}
              className="shrink-0 rounded-md border border-[#fff]/15 bg-[#3a1a24]/90 px-3 py-1.5 font-medium text-[#fff] hover:bg-[#3a1a24]"
            >
              View Hacker Wrapped
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss"
              className="-translate-y-1/2 absolute top-1/2 right-3 rounded-sm p-1 text-[#fff]/70 hover:text-[#fff]"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* The ship that pulls the banner across, nose first — sized to its rotated
            footprint so the nose sits exactly on the reveal edge for the whole flight. */}
          <div
            aria-hidden
            className="-translate-y-1/2 pointer-events-none absolute top-1/2"
            style={{
              width: BANNER_ROCKET_W,
              height: BANNER_ROCKET_H,
              ["--rocket-w" as string]: `${BANNER_ROCKET_W.toFixed(1)}px`,
              animation: `wrapped-banner-fly ${REVEAL_MS}ms ${REVEAL_EASE} both`,
            }}
          >
            <div
              className="absolute rotate-90"
              style={{
                width: ROCKET_WIDTH * BANNER_ROCKET_SCALE,
                height: ROCKET_HEIGHT * BANNER_ROCKET_SCALE,
                top: -BANNER_ROCKET_OFFSET,
                left: BANNER_ROCKET_OFFSET,
              }}
            >
              <RocketShip
                className="origin-top-left"
                style={{ transform: `scale(${BANNER_ROCKET_SCALE})` }}
              />
            </div>
          </div>
        </div>
      </div>

      {isLaunching && <LaunchOverlay />}
    </>
  );
}

/** Fades the dashboard into the intro's sky while the banner flies off, so the deck
    opens onto the same sky its stage starts on. */
function LaunchOverlay() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50">
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: INTRO_SKY,
          animation: `wrapped-fade ${EXIT_MS - 50}ms ease-in both`,
        }}
      />
    </div>
  );
}
