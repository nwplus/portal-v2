import { useHackathon } from "@/hooks/use-hackathon";
import { usePortalTheme } from "@/hooks/use-portal-theme";
import { cn, getColouredHackathonIcon } from "@/lib/utils";
import { Link, useCanGoBack, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "../ui/button";

/**
 * NOTE: Assets may need to be updated on each reskin:
 *  - `public/assets/{activeHackathon}/not-found`
 */

export default function NotFound() {
  const { activeHackathon } = useHackathon();
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
  const bearOffset = getParallaxOffset(32, 26);
  const nuggetOffset = getParallaxOffset(6, 8);
  const deerOffset = getParallaxOffset(24, 18);
  const trainOffset = getParallaxOffset(4, 12);

  return (
    <div className="gradient-bg relative h-screen overflow-hidden">
      <style>{`.gradient-bg { ${gradientStyle} }`}</style>
      <div className="relative flex h-full items-center justify-center pb-20">
        <div className="relative">
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
          <div className="-bottom-[100%] -translate-y-[25%] absolute translate-x-[70%] md:translate-x-[100%] md:translate-y-[0%]">
            <img
              aria-hidden
              alt=""
              className="pointer-events-none select-none"
              src={`/assets/${activeHackathon}/not-found/bear.svg`}
              style={{
                transform: `translate3d(${bearOffset.x}px, ${bearOffset.y}px, 0)`,
                transition: "transform 120ms ease-out",
              }}
            />
          </div>
          <div className="-right-[130%] absolute top-0">
            <img
              aria-hidden
              alt=""
              className="pointer-events-none select-none"
              src={`/assets/${activeHackathon}/not-found/nugget.svg`}
              style={{
                transform: `translate3d(${nuggetOffset.x}px, ${nuggetOffset.y}px, 0)`,
                transition: "transform 120ms ease-out",
              }}
            />
          </div>
          <div className="-left-[150%] -top-[30%] absolute">
            <img
              aria-hidden
              alt=""
              className="pointer-events-none select-none"
              src={`/assets/${activeHackathon}/not-found/deer.svg`}
              style={{
                transform: `translate3d(${deerOffset.x}px, ${deerOffset.y}px, 0)`,
                transition: "transform 120ms ease-out",
              }}
            />
          </div>
        </div>

        {/* PNG because svg was exporting weird - this train is positioned relative to the screen */}
        <img
          aria-hidden
          alt=""
          className="-left-10 pointer-events-none absolute bottom-20 hidden w-[30vw] select-none md:block"
          src={`/assets/${activeHackathon}/not-found/train.png`}
          style={{
            transform: `translate3d(${trainOffset.x}px, ${trainOffset.y}px, 0)`,
            transition: "transform 140ms ease-out",
          }}
        />
      </div>
    </div>
  );
}
