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
  const maskId = "ticket-mask";

  const svgWidth = isMobile ? height : width;
  const svgHeight = isMobile ? height + height * 0.7 : height;
  const foldY = isMobile ? height : undefined;

  return (
    <div style={{ width: svgWidth, height: svgHeight }}>
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ display: "block" }}
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
              <>
                {/* Horizontal layout: notches on top and bottom at foldX */}
                <circle cx={foldX} cy={0} r={notchRadius} fill="black" />
                <circle cx={foldX} cy={svgHeight} r={notchRadius} fill="black" />
              </>
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
            x1={foldX}
            y1={notchRadius}
            x2={foldX}
            y2={svgHeight - notchRadius}
            stroke="rgba(0,0,0,1)"
            strokeDasharray="6 6"
          />
        )}

        {/* Content slot */}
        <foreignObject x={0} y={0} width={svgWidth} height={svgHeight} mask={`url(#${maskId})`}>
          <div
            style={{
              width: "100%",
              height: "100%",
              position: "relative",
              display: "flex",
            }}
          >
            {children}
          </div>
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
