import { usePortalTheme } from "@/hooks/use-portal-theme";
import { VALID_HACKATHONS } from "@/lib/constants";
import { cn, getColouredHackathonIcon } from "@/lib/utils";
import { Link, useCanGoBack, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "../ui/button";

/** Art shown when the URL names no valid hackathon (e.g. a typo'd top-level path) */
const FALLBACK_HACKATHON = "hackcamp";

/**
 * Resolves the hackathon for a 404 without requiring the `/$activeHackathon` route to have
 * matched. This is the router's global `defaultNotFoundComponent`, so it also renders for
 * URLs outside that route — `useHackathon()` would throw there.
 */
const useNotFoundHackathon = () =>
  useRouterState({
    select: (state) => {
      const context = state.matches.find((match) => match.routeId === "/$activeHackathon")
        ?.context as { activeHackathon?: string } | undefined;

      // When the slug fails to parse, context can still carry the raw, unvalidated param
      // (e.g. "foo" for /foo), so validate it rather than trusting it. The URL segment
      // covers the case where the route bailed out before building context at all.
      const segment = state.location.pathname.split("/")[1];
      for (const candidate of [context?.activeHackathon, segment]) {
        const parsed = VALID_HACKATHONS.safeParse(candidate?.toLowerCase());
        if (parsed.success) return parsed.data;
      }
      return FALLBACK_HACKATHON;
    },
  });

/**
 * NOTE: Assets may need to be updated on each reskin:
 *  - `public/assets/{activeHackathon}/not-found`
 */

type ParallaxArt = {
  /** File name within `public/assets/{activeHackathon}/not-found/` */
  file: string;
  /** How far the piece drifts with the cursor, in px */
  limitX: number;
  limitY: number;
  /** Positioning; "content" is relative to the centered message, "screen" to the viewport */
  anchor: "content" | "screen";
  className: string;
  /**
   * Sizing for the `<img>` itself. Without it the SVG renders at its intrinsic pixel size,
   * which makes the art a different relative size on every viewport.
   */
  imgClassName?: string;
};

/**
 * The art that floats around the 404 message, per hackathon. A hackathon with no entry
 * renders the message alone rather than requesting assets that do not exist.
 */
const NOT_FOUND_ART: Record<string, ParallaxArt[]> = {
  nwhacks: [
    {
      file: "bear.svg",
      limitX: 32,
      limitY: 26,
      anchor: "content",
      className:
        "-bottom-[100%] -translate-y-[25%] absolute translate-x-[70%] md:translate-x-[100%] md:translate-y-[0%]",
    },
    {
      file: "nugget.svg",
      limitX: 6,
      limitY: 8,
      anchor: "content",
      className: "-right-[130%] absolute top-0",
    },
    {
      file: "deer.svg",
      limitX: 24,
      limitY: 18,
      anchor: "content",
      className: "-left-[150%] -top-[30%] absolute",
    },
    // PNG because svg was exporting weird
    {
      file: "train.png",
      limitX: 4,
      limitY: 12,
      anchor: "screen",
      className: "-left-10 absolute bottom-20 hidden w-[30vw] md:block",
    },
  ],
  // Positions are percentages of the Figma 404 frame (1920x1080), so the scene keeps its
  // proportions on any screen. All three pieces scale from their width and keep their
  // aspect ratio; none is cropped.
  hackcamp: [
    {
      // Holds all 11 stars. Its clip path maps the SVG viewport to frame x 84.02..1870.02,
      // y 0..812 — hence the offset and width below. Cropping it (object-cover) would cut
      // the outermost stars off, so it is sized by width and left to keep its aspect.
      file: "stars.svg",
      limitX: 6,
      limitY: 8,
      anchor: "screen",
      className: "absolute top-0 left-[4.4%] w-[93%]",
      imgClassName: "w-full",
    },
    {
      // Lower left, pulled in toward the centre. Its right edge stops at 35% — the 404
      // message starts at 36.9% — and it clears the 4 point star at x 8.2..10.9%.
      file: "build-day-sheep.svg",
      limitX: 32,
      limitY: 26,
      anchor: "screen",
      className: "absolute top-[38%] left-[12%] w-[23%]",
      imgClassName: "w-full",
    },
    {
      // Upper right, pulled in toward the centre. Sits in the gap between the 4 point star
      // above (ends y 12.7%) and the drop below (starts y 53.7%), stopping short of the
      // 8 point star at x 85.2%.
      file: "learn-week-sheep.svg",
      limitX: 24,
      limitY: 18,
      anchor: "screen",
      className: "absolute top-[20%] left-[65%] w-[20%]",
      imgClassName: "w-full",
    },
  ],
};

export default function NotFound() {
  const activeHackathon = useNotFoundHackathon();
  const router = useRouter();
  const canGoBack = useCanGoBack(); // true when user navigates here, false when user directly enters a bad URL
  const [cursorRatio, setCursorRatio] = useState({ x: 0, y: 0 });

  const portalTheme = usePortalTheme();
  const gradientStyle = portalTheme?.[activeHackathon]?.backgroundGradients?.bottomMiddle;

  const HackathonIcon = getColouredHackathonIcon(activeHackathon);

  useEffect(() => {
    let rafId = 0;
    const handlePointerMove = (event: PointerEvent) => {
      const nextX = ((event.clientX ?? 0) / window.innerWidth - 0.5) * 2;
      const nextY = ((event.clientY ?? 0) / window.innerHeight - 0.5) * 2;

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setCursorRatio({ x: nextX, y: nextY }));
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const getParallaxOffset = (limitX: number, limitY: number) => ({
    x: cursorRatio.x * limitX,
    y: cursorRatio.y * limitY,
  });

  const infoOffset = getParallaxOffset(6, 4);

  const art = NOT_FOUND_ART[activeHackathon] ?? [];
  const renderArt = (piece: ParallaxArt) => {
    const offset = getParallaxOffset(piece.limitX, piece.limitY);
    return (
      <div key={piece.file} className={piece.className}>
        <img
          aria-hidden
          alt=""
          className={cn("pointer-events-none select-none", piece.imgClassName)}
          src={`/assets/${activeHackathon}/not-found/${piece.file}`}
          style={{
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
            transition: "transform 120ms ease-out",
          }}
        />
      </div>
    );
  };

  return (
    <div className="gradient-bg relative h-screen overflow-hidden">
      <style>{`.gradient-bg { ${gradientStyle} }`}</style>
      <div className="relative flex h-full items-center justify-center pb-20">
        {/* Anchored to the viewport rather than the message, and painted behind it */}
        {art.filter((piece) => piece.anchor === "screen").map(renderArt)}

        <div className="relative z-10">
          <div
            className="flex flex-col gap-2 text-center"
            style={{
              transform: `translate3d(${infoOffset.x}px, ${infoOffset.y}px, 0)`,
              transition: "transform 120ms ease-out",
            }}
          >
            <div className="flex flex-col gap-3 pb-3">
              <div className="mx-auto flex aspect-square h-fit justify-center md:mx-0 md:h-12">
                <HackathonIcon />
              </div>
              <h1 className="pt-2 font-semibold text-5xl">404</h1>
              <h1 className="font-medium text-3xl">Page not found</h1>
              <p className="pt-4 text-text-neutral">
                Oops! You&apos;ve wandered off the map.
                <br />
                Try checking the URL or return Home.
              </p>
            </div>
            <div className="flex justify-center">
              {canGoBack ? (
                // theoretically won't ever be hit because of type safety LOL
                <Button variant="secondary" onClick={() => router.history.back()}>
                  Go back
                </Button>
              ) : (
                <Link
                  to="/"
                  preload="intent"
                  className={cn(buttonVariants({ variant: "secondary" }))}
                >
                  Go back home
                </Link>
              )}
            </div>
          </div>

          {/* These "lost in space" assets are positioned relative to the center content;
              this means '%' takes a percentage of the center content's dimensions */}
          {art.filter((piece) => piece.anchor === "content").map(renderArt)}
        </div>
      </div>
    </div>
  );
}
