import { useElementDimension } from "@/hooks/use-element-dimension";
import { useHackathon } from "@/hooks/use-hackathon";
import type { Applicant } from "@/lib/firebase/types/applicants";
import { cn, getFullName } from "@/lib/utils";
import { createRef, useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import QRCode from "react-qr-code";
import { Badge } from "../../ui/badge";

const formatPronouns = (pronouns?: Record<string, boolean>, otherPronouns?: string) => {
  const selected = Object.keys(pronouns ?? {})
    .filter((key) => pronouns?.[key] === true)
    .map((p) => p.replace(/\b\w/g, (c) => c.toUpperCase()));
  if (otherPronouns?.trim()) selected.push(otherPronouns.trim());
  return selected.length > 0 ? selected.join(", ") : null;
};

export interface PlacedSticker {
  id: number;
  src: string;
  x?: number;
  y?: number;
}

interface TicketProps {
  applicant: Applicant;
  placedStickers: PlacedSticker[];
  width?: number;
  height?: number;
  foldX?: number;
  radius?: number;
  notchRadius?: number;
}

export function Ticket({
  applicant,
  placedStickers,
  width = 900,
  height = 300,
  foldX = 600,
  radius = 18,
  notchRadius = 26,
}: TicketProps) {
  const { activeHackathon } = useHackathon();
  const qrData = applicant?._id
    ? `${window.location.origin}/${activeHackathon}/social-profile/${applicant._id}`
    : "";

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

  // --- Sticker overlay state ---
  const [stickerPositions, setStickerPositions] = useState<
    Record<number, { x: number; y: number }>
  >({});

  // refs for react-draggable to avoid findDOMNode (React 19 removed findDOMNode)
  // allow the RefObject current to be null to match React's RefObject<T> definition
  const stickerNodeRefs = useRef<Record<number, React.RefObject<HTMLDivElement | null>>>({});

  // initialize missing sticker positions (normalized coords) when placedStickers changes
  useEffect(() => {
    setStickerPositions((current) => {
      const next = { ...current };
      placedStickers.forEach((s, idx) => {
        if (next[s.id] === undefined) {
          // use provided normalized coords if present, else default positions staggered near the center-right
          const defaultX = s.x ?? 0.65 - (idx % 3) * 0.04;
          const defaultY = s.y ?? 0.2 + (idx % 5) * 0.06;
          next[s.id] = {
            x: Math.min(Math.max(defaultX, 0), 1),
            y: Math.min(Math.max(defaultY, 0), 1),
          };
        }
      });
      // Remove any positions for stickers that no longer exist
      for (const key of Object.keys(next)) {
        const idNum = Number(key);
        if (!placedStickers.find((ps) => ps.id === idNum)) delete next[idNum];
      }
      return next;
    });
  }, [placedStickers]);

  // helper to convert normalized -> pixels
  const toPixel = (pos: { x: number; y: number }) => ({
    x: Math.round((svgWidth || 1) * pos.x),
    y: Math.round((svgHeight || 1) * pos.y),
  });

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
                  src={`/assets/${activeHackathon}/ticket/ticket-decal.svg`}
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

              {/* Sticker overlay layer (absolute full-size) */}
              <div
                aria-hidden
                className="pointer-events-auto absolute inset-0"
                style={{ zIndex: 60 }}
              >
                {placedStickers.map((sticker) => {
                  const pos = stickerPositions[sticker.id];
                  const pixel = pos
                    ? toPixel(pos)
                    : { x: Math.round(svgWidth * 0.6), y: Math.round(svgHeight * 0.2) };
                  const stickerSize = Math.round(Math.max(40, Math.min(80, svgWidth * 0.07))); // responsive size

                  // ensure a RefObject exists for this sticker (used by react-draggable to avoid findDOMNode)
                  if (!stickerNodeRefs.current[sticker.id]) {
                    stickerNodeRefs.current[sticker.id] = createRef<HTMLDivElement | null>();
                  }
                  const nodeRef = stickerNodeRefs.current[sticker.id];

                  return (
                    <Draggable
                      key={sticker.id}
                      nodeRef={nodeRef}
                      bounds="parent"
                      defaultPosition={{ x: pixel.x, y: pixel.y }}
                      onStop={(_, data) => {
                        // data.x / data.y are final pixel positions relative to parent
                        const normX = svgWidth ? data.x / svgWidth : 0;
                        const normY = svgHeight ? data.y / svgHeight : 0;
                        setStickerPositions((prev) => ({
                          ...prev,
                          [sticker.id]: { x: normX, y: normY },
                        }));
                      }}
                    >
                      <div
                        ref={nodeRef}
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          width: stickerSize,
                          height: stickerSize,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          touchAction: "none",
                          cursor: "grab",
                        }}
                      >
                        <img
                          src={sticker.src}
                          alt=""
                          draggable={false}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            pointerEvents: "auto",
                            userSelect: "none",
                          }}
                        />
                      </div>
                    </Draggable>
                  );
                })}
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
