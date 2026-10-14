import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

const ASSETS = "/assets/wrapped/intro";

/** The ship's natural size in comp pixels, from the Intro frame's "rocket ship" group. */
export const ROCKET_WIDTH = 510;
export const ROCKET_HEIGHT = 696;

/**
 * The Wrapped rocket, nose up, in a 510x696 box — shared by the intro slide and the
 * dashboard banner, so the ship the hacker clicks is the one that opens the deck.
 *
 * Laid out in the Intro frame's comp pixels, offset to the group's top-left. Scale it
 * with a transform on a wrapper; every part is absolutely positioned.
 */
export function RocketShip({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      className={cn("relative", className)}
      style={{ width: ROCKET_WIDTH, height: ROCKET_HEIGHT, ...style }}
    >
      <div className="absolute top-[621px] left-[165px] h-[75px] w-[181px]">
        <img
          alt=""
          src={`${ASSETS}/rocket-base-small.svg`}
          className="absolute inset-[0_0.46%_0_0.43%] block size-full max-w-none"
        />
      </div>
      <div className="absolute top-[583.99px] left-[117px] h-[75px] w-[279px]">
        <img
          alt=""
          src={`${ASSETS}/rocket-base-large.svg`}
          className="absolute inset-[0_0.47%_0_0.44%] block size-full max-w-none"
        />
      </div>
      <img
        alt=""
        src={`${ASSETS}/rocket-fin-left.svg`}
        className="absolute top-[393px] left-0 h-[270.785px] w-[161.676px] max-w-none"
      />
      <img
        alt=""
        src={`${ASSETS}/rocket-fin-right.svg`}
        className="-scale-x-100 absolute top-[388px] left-[348px] h-[270.785px] w-[161.676px] max-w-none"
      />
      <img
        alt=""
        src={`${ASSETS}/rocket-nose.svg`}
        className="absolute top-0 left-[171.41px] h-[178.893px] w-[164.672px] max-w-none"
      />
      <img
        alt=""
        src={`${ASSETS}/rocket-body.svg`}
        className="absolute top-[108px] left-[109.5px] h-[506.488px] w-[293.371px] max-w-none"
      />
      <div className="absolute top-[9px] left-[260px] h-[587px] w-[141px] mix-blend-screen">
        <img
          alt=""
          src={`${ASSETS}/rocket-shine.svg`}
          className="absolute inset-[-4.7%_-19.57%] block size-full max-w-none"
        />
      </div>
      <div className="absolute top-[249.99px] left-[171.5px] size-[175.652px]">
        <img
          alt=""
          src={`${ASSETS}/rocket-window.svg`}
          className="absolute inset-[-2.28%] block size-full max-w-none"
        />
      </div>
      <img
        alt=""
        src={`${ASSETS}/rocket-stripe.svg`}
        className="absolute top-[445.99px] left-[232px] h-[210px] w-[46px] max-w-none"
      />
    </div>
  );
}
