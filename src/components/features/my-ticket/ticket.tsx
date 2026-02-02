import { useElementDimension } from "@/hooks/use-element-dimension";
import { useHackathon } from "@/hooks/use-hackathon";
import type { Applicant } from "@/lib/firebase/types/applicants";
import { cn, getFullName } from "@/lib/utils";
import { X } from "lucide-react";
import { createRef, useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import QRCode from "react-qr-code";
import { Badge } from "../../ui/badge";

const formatPronouns = (pronouns?: Record<string, boolean>, otherPronouns?: string) => {
  const selected = Object.keys(pronouns ?? {})
    .filter((key) => key !== "other" && pronouns?.[key] === true)
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
  selectedFont?: string | undefined;
  onPlacedStickersChange?: (placedStickers: PlacedSticker[]) => void;
  isCustomizing?: boolean;
}

export function Ticket({
  applicant,
  placedStickers,
  width = 900,
  height = 300,
  foldX = 600,
  radius = 18,
  notchRadius = 26,
  selectedFont,
  onPlacedStickersChange,
  isCustomizing = false,
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

  const [hoveredStickerId, setHoveredStickerId] = useState<number | null>(null);

  // refs for react-draggable to avoid findDOMNode (React 19 removed findDOMNode)
  const stickerNodeRefs = useRef<Record<number, React.RefObject<HTMLDivElement | null>>>({});

  // Sync sticker positions with placedStickers prop (handles cancel/restore)
  useEffect(() => {
    setStickerPositions((current) => {
      const next: Record<number, { x: number; y: number }> = {};
      placedStickers.forEach((s, idx) => {
        // If sticker has x/y from props, use those; otherwise use current or default
        if (s.x !== undefined && s.y !== undefined) {
          next[s.id] = { x: s.x, y: s.y };
        } else if (current[s.id] !== undefined) {
          next[s.id] = current[s.id];
        } else {
          // default positions staggered near the center-right
          const defaultX = 0.65 - (idx % 3) * 0.04;
          const defaultY = 0.2 + (idx % 5) * 0.06;
          next[s.id] = {
            x: Math.min(Math.max(defaultX, 0), 1),
            y: Math.min(Math.max(defaultY, 0), 1),
          };
        }
      });

      // Build the placedStickers array that would result if we persisted `next`
      const nextPlaced = placedStickers.map((s) => ({
        ...s,
        x: next[s.id]?.x,
        y: next[s.id]?.y,
      }));

      // Only notify parent if something actually changed (prevents infinite loop)
      let changed = false;
      if (nextPlaced.length !== placedStickers.length) {
        changed = true;
      } else {
        for (let i = 0; i < placedStickers.length; i++) {
          const a = placedStickers[i];
          const b = nextPlaced[i];
          if (a.x !== b.x || a.y !== b.y) {
            changed = true;
            break;
          }
        }
      }
      if (changed) {
        onPlacedStickersChange?.(nextPlaced);
      }

      return next;
    });
  }, [placedStickers, onPlacedStickersChange]);

  // exclusion boundary so stickers don't overlap with QR code
  const qrZoneStartX = 0.7;

  // helper to convert normalized -> pixels
  const toPixel = (pos: { x: number; y: number }) => ({
    x: Math.round((svgWidth || 1) * pos.x),
    y: Math.round((svgHeight || 1) * pos.y),
  });

  const handleDeleteSticker = (stickerId: number) => {
    const nextPlaced = placedStickers.filter((s) => s.id !== stickerId);
    onPlacedStickersChange?.(nextPlaced);
  };

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
        <div
          className="relative mx-auto"
          style={{ width: svgWidth, height: svgHeight, overflow: "hidden", borderRadius: radius }}
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
                    <circle cx={0} cy={foldY} r={notchRadius} fill="black" />
                    <circle cx={svgWidth} cy={foldY} r={notchRadius} fill="black" />
                  </>
                ) : (
                  (() => {
                    const foldXRatio = foldX / width;
                    const scaledFoldX = foldXRatio * svgWidth;
                    return (
                      <>
                        <circle cx={scaledFoldX} cy={0} r={notchRadius} fill="black" />
                        <circle cx={scaledFoldX} cy={svgHeight} r={notchRadius} fill="black" />
                      </>
                    );
                  })()
                )}
              </mask>
              <pattern
                id="ticket-background"
                patternUnits="userSpaceOnUse"
                width={svgWidth}
                height={svgHeight}
              >
                <image
                  href={`/assets/${activeHackathon}/ticket/background.png`}
                  x="0"
                  y="0"
                  width={svgWidth}
                  height={svgHeight}
                  preserveAspectRatio="xMidYMax slice"
                />
              </pattern>
            </defs>

            {/* Card background */}
            <rect
              width="100%"
              height="100%"
              rx={radius}
              fill="url(#ticket-background)"
              mask={`url(#${maskId})`}
            />

            {/* Dashed fold line */}
            {isMobile ? (
              <line
                x1={notchRadius}
                y1={foldY}
                x2={svgWidth - notchRadius}
                y2={foldY}
                stroke="rgba(0,0,0,1)"
                strokeDasharray="6 6"
              />
            ) : null}
          </svg>

          {/* Content overlay */}
          <div className={cn("absolute inset-0 flex", isMobile ? "flex-col-reverse" : "flex-row")}>
            <div
              className={cn("flex h-full flex-col justify-end", isMobile && "items-end")}
              style={{
                zIndex: 20,
                pointerEvents: "none",
                height: isMobile ? `${svgHeight - (foldY ?? 0)}px` : "100%",
                maxWidth: isMobile ? "100%" : `${(foldX / width) * svgWidth}px`,
              }}
            >
              <img
                className={cn("h-full", isMobile ? "hidden" : "block")}
                draggable={false}
                src={`/assets/${activeHackathon}/ticket/ticket-decal.svg`}
                style={{
                  maxWidth: "100%",
                  objectFit: "contain",
                  objectPosition: "bottom left",
                }}
              />
              <div
                className={cn(
                  "absolute flex flex-col gap-2",
                  isMobile ? "self-end p-14" : "bottom-20 left-50 p-8", // Changed from "bottom-0 left-0 p-14"
                )}
                style={{
                  fontFamily: selectedFont ?? "var(--font-mono)",
                  color: "#0C2360",
                }}
              >
                <Badge className="border-[#E4E4E740] bg-[#E76C79] uppercase">Hacker</Badge>
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

            {/* Sticker overlay - rendered below text/QR with zIndex: 10 */}
            {!isMobile && (
              <div
                aria-hidden
                className="absolute inset-0"
                style={{ zIndex: 10, pointerEvents: isCustomizing ? "auto" : "none" }}
              >
                {placedStickers.map((sticker) => {
                  const pos = stickerPositions[sticker.id];
                  const pixel = pos
                    ? toPixel(pos)
                    : { x: Math.round(svgWidth * 0.6), y: Math.round(svgHeight * 0.2) };
                  const stickerSize = Math.round(Math.max(40, Math.min(80, svgWidth * 0.07)));

                  if (!stickerNodeRefs.current[sticker.id]) {
                    stickerNodeRefs.current[sticker.id] = createRef<HTMLDivElement | null>();
                  }
                  const nodeRef = stickerNodeRefs.current[sticker.id];

                  // Calculate notch exclusion zone
                  const foldXRatio = foldX / width;
                  const scaledFoldX = foldXRatio * svgWidth;
                  const notchLeft = scaledFoldX - notchRadius - stickerSize;
                  const notchRight = scaledFoldX + notchRadius;

                  // Helper to clamp position away from notches
                  const clampPosition = (x: number, y: number) => {
                    let clampedX = x;
                    const isNearNotchX = x + stickerSize > notchLeft && x < notchRight;
                    if (isNearNotchX) {
                      const isNearTopNotch = y < notchRadius;
                      const isNearBottomNotch = y + stickerSize > svgHeight - notchRadius;
                      if (isNearTopNotch || isNearBottomNotch) {
                        // Push sticker away from notch area
                        if (x + stickerSize / 2 < scaledFoldX) {
                          clampedX = notchLeft;
                        } else {
                          clampedX = notchRight;
                        }
                      }
                    }
                    return { x: clampedX, y };
                  };

                  return (
                    <Draggable
                      key={sticker.id}
                      nodeRef={nodeRef}
                      bounds={{
                        left: 0,
                        top: 0,
                        right: Math.round(svgWidth * qrZoneStartX) - stickerSize,
                        bottom: svgHeight - stickerSize,
                      }}
                      position={{ x: pixel.x, y: pixel.y }}
                      disabled={!isCustomizing}
                      onDrag={(_, data) => {
                        const normX = svgWidth ? data.x / svgWidth : 0;
                        const normY = svgHeight ? data.y / svgHeight : 0;
                        setStickerPositions((prev) => ({
                          ...prev,
                          [sticker.id]: { x: normX, y: normY },
                        }));
                      }}
                      onStop={(_, data) => {
                        const clamped = clampPosition(data.x, data.y);
                        const normX = svgWidth ? clamped.x / svgWidth : 0;
                        const normY = svgHeight ? clamped.y / svgHeight : 0;

                        setStickerPositions((prev) => ({
                          ...prev,
                          [sticker.id]: { x: normX, y: normY },
                        }));

                        const nextPlaced = placedStickers.map((s) =>
                          s.id === sticker.id ? { ...s, x: normX, y: normY } : s,
                        );
                        onPlacedStickersChange?.(nextPlaced);
                      }}
                    >
                      <div
                        ref={nodeRef}
                        onMouseEnter={() => setHoveredStickerId(sticker.id)}
                        onMouseLeave={() => setHoveredStickerId(null)}
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
                          cursor: isCustomizing ? "grab" : "default",
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
                        {isCustomizing && hoveredStickerId === sticker.id && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSticker(sticker.id);
                            }}
                            className="-top-3 -right-3 absolute flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white transition-transform hover:scale-110"
                            aria-label="Delete sticker"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </Draggable>
                  );
                })}
              </div>
            )}
            <div
              className={cn(
                "flex items-center justify-center",
                isMobile ? "aspect-square h-auto w-full p-10" : "absolute top-0 right-0 p-14",
              )}
              style={{
                zIndex: 20,
                pointerEvents: "none",
                height: isMobile ? foldY : svgHeight,
                width: isMobile ? undefined : svgHeight,
              }}
            >
              <QRCode
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox="0 0 256 256"
                value={qrData ?? ""}
                bgColor="rgba(0,0,0,0)"
                fgColor="#18338D"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
