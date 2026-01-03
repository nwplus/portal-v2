import { useElementDimension } from "@/hooks/use-element-dimension";
import type { Applicant } from "@/lib/firebase/types/applicants";
import { cn, getFullName } from "@/lib/utils";
import QRCode from "react-qr-code";
import { Badge } from "../../ui/badge";

const formatPronouns = (pronouns?: Record<string, boolean>, otherPronouns?: string) => {
  const selected = Object.keys(pronouns ?? {})
    .filter((key) => pronouns?.[key] === true)
    .map((p) => p.replace(/\b\w/g, (c) => c.toUpperCase()));
  if (otherPronouns?.trim()) selected.push(otherPronouns.trim());
  return selected.length > 0 ? selected.join(", ") : null;
};

type TicketProps = {
  applicant: Applicant;
  width?: number;
  height?: number;
  foldX?: number;
  radius?: number;
  notchRadius?: number;
};

export function Ticket({
  applicant,
  width = 900,
  height = 300,
  foldX = 600,
  radius = 18,
  notchRadius = 26,
}: TicketProps) {
  const qrData = applicant?._id;

  // We use manual breakpoints for styles using `isMobile` below instead of
  // TailwindCSS breakpoints so that breakpoints are based on relevant (parent)
  // container instead of the global viewport
  const containerDimensions = useElementDimension("main#sidebar-inset, main[data-slot]");
  const containerWidth = containerDimensions?.width ?? null;
  const isMobile = (containerDimensions?.width ?? Number.POSITIVE_INFINITY) < 1000;
  const maskId = "ticket-mask";
  const desktopAspectRatio = 1 / 3;

  const horizontalPadding = isMobile ? 0 : 16;
  const availableWidth =
    containerWidth !== null ? Math.max(containerWidth - horizontalPadding * 10, 0) : width;
  const svgWidth = isMobile ? height : Math.min(width, availableWidth);
  const svgHeight = isMobile ? height + height * 0.7 : svgWidth * desktopAspectRatio;
  const foldY = isMobile ? height : undefined;

  return (
    <div className="flex flex-col items-center">
      <div
        className="box-border w-full"
        style={{
          maxWidth: isMobile ? "none" : width,
          paddingInline: horizontalPadding,
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
            <div className="relative flex h-full w-full">
              <div className="flex h-full items-center">
                <img
                  className={cn("h-full", isMobile ? "hidden" : "block")}
                  draggable={false}
                  src="/assets/ticket/ticket-decal.svg"
                />
                <div
                  className={cn(
                    "flex flex-col gap-2 font-mono",
                    isMobile ? "self-end p-10" : "self-center p-0",
                  )}
                >
                  <Badge className="border-[#E4E4E730] bg-[#693F61] uppercase">Hacker</Badge>
                  <div className="flex flex-col">
                    <div className={cn("font-bold", isMobile ? "text-3xl" : "text-4xl")}>
                      {getFullName(applicant)}
                    </div>
                    <div className="max-w-[75%] break-words">
                      {formatPronouns(
                        applicant?.basicInfo?.pronouns,
                        applicant?.basicInfo?.otherPronouns,
                      )}
                    </div>
                  </div>
                  <div>{applicant?.basicInfo?.email ?? "No email"}</div>
                </div>
              </div>
              <div
                className={cn(
                  "absolute top-0 right-0 flex aspect-square items-center justify-center ",
                  isMobile ? "h-auto w-full p-10" : "h-full w-auto p-14",
                )}
              >
                <QRCode
                  size={256}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox="0 0 256 256"
                  value={qrData ?? ""}
                  bgColor="rgba(0,0,0,0)"
                  fgColor="white"
                />
              </div>
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
    </div>
  );
}
