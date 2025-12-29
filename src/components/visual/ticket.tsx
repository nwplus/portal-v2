import { useEffect, useState } from "react";

import { useIsMobile } from "@/hooks/use-mobile";

type TicketProps = {
  width?: number;
  height?: number;
  foldX?: number;
  radius?: number;
  notchRadius?: number;
  children?: React.ReactNode;
};

export function Ticket({
  width = 900,
  height = 300,
  foldX = 600,
  radius = 18,
  notchRadius = 26,
  children,
}: TicketProps) {
  const isMobile = useIsMobile();
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const maskId = "ticket-mask";
  const desktopAspectRatio = 1 / 3;

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const horizontalPadding = isMobile ? 0 : 16;
  const availableWidth =
    viewportWidth !== null ? Math.max(viewportWidth - horizontalPadding * 10, 0) : width;
  const svgWidth = isMobile ? height : Math.min(width, availableWidth);
  const svgHeight = isMobile ? height + height * 0.7 : svgWidth * desktopAspectRatio;
  const foldY = isMobile ? height : undefined;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: isMobile ? "none" : width,
        paddingInline: horizontalPadding,
        boxSizing: "border-box",
        height: svgHeight,
      }}
    >
      <svg
        className="mx-auto block"
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" rx={radius} />

            {isMobile ? (
              <>
                {/* Vertical layout: notches on left and right sides at foldY */}
                <circle cx={0} cy={foldY} r={notchRadius} fill="black" />
                <circle cx={svgWidth} cy={foldY} r={notchRadius} fill="black" />
              </>
            ) : (
              (() => {
                const foldXRatio = foldX / width;
                const scaledFoldX = foldXRatio * svgWidth;
                return (
                  <>
                    {/* Horizontal layout: notches on top and bottom at foldX */}
                    <circle cx={scaledFoldX} cy={0} r={notchRadius} fill="black" />
                    <circle cx={scaledFoldX} cy={svgHeight} r={notchRadius} fill="black" />
                  </>
                );
              })()
            )}
          </mask>
        </defs>

        {/* Card background */}
        <rect
          width="100%"
          height="100%"
          rx={radius}
          fill={`url(#ticket-gradient-${isMobile ? "vertical" : "horizontal"})`}
          mask={`url(#${maskId})`}
        />

        {isMobile ? (
          <line
            x1={0}
            y1={foldY}
            x2={svgWidth}
            y2={foldY}
            stroke="rgba(0,0,0,1)"
            strokeDasharray="6 6"
          />
        ) : (
          <line
            x1={(foldX / width) * svgWidth}
            y1={notchRadius}
            x2={(foldX / width) * svgWidth}
            y2={svgHeight - notchRadius}
            stroke="rgba(0,0,0,1)"
            strokeDasharray="6 6"
          />
        )}

        {/* Content slot */}
        <foreignObject x={0} y={0} width={svgWidth} height={svgHeight} mask={`url(#${maskId})`}>
          <div className="relative flex h-full w-full">{children}</div>
        </foreignObject>
        <defs>
          {/* Horizontal gradient (desktop) */}
          <linearGradient id="ticket-gradient-horizontal" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#140423" />
            <stop offset="100%" stopColor="#693F61" />
          </linearGradient>
          {/* Vertical gradient (mobile) */}
          <linearGradient id="ticket-gradient-vertical" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#693F61" />
            <stop offset="100%" stopColor="#140423" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
