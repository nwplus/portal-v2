import { ROCKET_HEIGHT, ROCKET_WIDTH, RocketShip } from "@/components/features/wrapped/rocket-ship";
import { useHackathon } from "@/hooks/use-hackathon";
import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import { useWrappedReady } from "@/hooks/use-wrapped-ready";
import { useAuthStore } from "@/lib/stores/auth-store";
import { dismissWrappedBanner, isWrappedBannerDismissed } from "@/lib/wrapped/banner-dismissal";
import { fetchWrappedOptIn } from "@/services/socials";
import { fetchWrappedDoc } from "@/services/wrapped";
import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

/** How long the rocket takes to cross the banner, revealing it behind itself. */
const REVEAL_MS = 1600;
/** Launch: the ship rises, the page fades to the intro's sky, then the deck opens. */
const LAUNCH_MS = 1300;
const LAUNCH_FADE_DELAY_MS = 600;

/** Ship sizes, as a fraction of its natural 510x696. */
const BANNER_ROCKET_SCALE = 0.07;
const LAUNCH_ROCKET_SCALE = 0.55;

/**
 * TEMPORARY: shows the banner in dev regardless of release, deck, opt-in or dismissal, and
 * launches into the `full` mock deck, so the banner can be seen without seeding data.
 * Remove before release.
 */
const FORCE_BANNER = import.meta.env.DEV;

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
    setIsLaunching(true);
    setTimeout(openDeck, LAUNCH_MS);
  };

  return (
    <>
      <div
        className="sticky top-0 z-40 overflow-hidden"
        style={isLaunching ? { animation: "wrapped-banner-exit 400ms ease-in both" } : undefined}
      >
        <div
          className="relative flex min-h-12 items-center justify-center gap-4 py-2 pr-12 pl-14 text-[#fff] text-sm md:pl-12"
          style={{
            backgroundImage:
              "linear-gradient(90deg, #141414 0%, #4a2230 18%, #6b2633 38%, #9c8a2e 50%, #6b2633 62%, #4a2230 82%, #141414 100%)",
            backgroundSize: "200% 100%",
            animation: `wrapped-banner-reveal ${REVEAL_MS}ms linear both, wrapped-banner-glow 6s linear ${REVEAL_MS}ms infinite`,
          }}
        >
          <p className="min-w-0 text-center">
            <span className="font-semibold">Your Wrapped has landed!</span>{" "}
            <span className="hidden text-[#fff]/85 sm:inline">Explore your hackathon journey</span>
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

        {/* The ship that pulls the banner across, nose first. */}
        <div
          aria-hidden
          className="-translate-y-1/2 pointer-events-none absolute top-1/2"
          style={{ animation: `wrapped-banner-fly ${REVEAL_MS}ms linear both` }}
        >
          <div
            className="-translate-x-full rotate-90"
            style={{
              width: ROCKET_WIDTH * BANNER_ROCKET_SCALE,
              height: ROCKET_HEIGHT * BANNER_ROCKET_SCALE,
            }}
          >
            <RocketShip
              className="origin-top-left"
              style={{ transform: `scale(${BANNER_ROCKET_SCALE})` }}
            />
          </div>
        </div>
      </div>

      {isLaunching && <LaunchOverlay />}
    </>
  );
}

/** Full-screen take-off between the dashboard and the deck. */
function LaunchOverlay() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: INTRO_SKY,
          animation: `wrapped-fade ${LAUNCH_MS - LAUNCH_FADE_DELAY_MS}ms ease-in ${LAUNCH_FADE_DELAY_MS}ms both`,
        }}
      />
      <div
        className="absolute bottom-0 left-1/2"
        style={{
          width: ROCKET_WIDTH * LAUNCH_ROCKET_SCALE,
          height: ROCKET_HEIGHT * LAUNCH_ROCKET_SCALE,
          marginLeft: -(ROCKET_WIDTH * LAUNCH_ROCKET_SCALE) / 2,
          animation: `wrapped-launch ${LAUNCH_MS}ms cubic-bezier(0.5, 0, 0.75, 0) both`,
        }}
      >
        <RocketShip
          className="origin-top-left"
          style={{ transform: `scale(${LAUNCH_ROCKET_SCALE})` }}
        />
      </div>
    </div>
  );
}
