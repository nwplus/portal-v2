import { useElementDimension } from "@/hooks/use-element-dimension";
import { useHackathon } from "@/hooks/use-hackathon";
import type { Applicant } from "@/lib/firebase/types/applicants";
import { cn, getFullName } from "@/lib/utils";
import { fetchSocial } from "@/services/socials";
import { X } from "lucide-react";
import { createRef, useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import QRCode from "react-qr-code";
import { Badge } from "../../ui/badge";

/** Formats pronouns from the application form, used when the social profile has none. */
const formatApplicationPronouns = (pronouns?: Record<string, boolean>, otherPronouns?: string) => {
  const selected = Object.keys(pronouns ?? {}).filter(
    (key) => key !== "other" && !key.startsWith("preferNot") && pronouns?.[key] === true,
  );
  if (otherPronouns?.trim()) selected.push(otherPronouns.trim());
  return selected.length > 0 ? `(${selected.join(", ")})` : null;
};

/**
 * Hackathons whose ticket art ships the foreground cluster as a separate
 * `ticket/ticket-decal.svg` overlay. HackCamp bakes it into `ticket/background.png`
 * instead, so drawing a decal on top would double it.
 */
const HACKATHONS_WITH_TICKET_DECAL = new Set(["nwhacks", "cmd-f"]);

/** Hackathons whose ticket shows `ticket/logo.svg` in the top-left corner. */
const HACKATHONS_WITH_TICKET_LOGO = new Set(["hackcamp"]);

/**
 * Hackathons with dedicated vertical ticket art under `ticket/mobile/`. Its background
 * already bakes in the notches and fold line, so the generic mask and dashed line are skipped.
 */
const HACKATHONS_WITH_MOBILE_TICKET_ART = new Set(["hackcamp"]);

// The mobile art is authored landscape in Figma (these units) and rotated -90° into portrait
const MOBILE_ART_WIDTH = 445.574;
const MOBILE_ART_HEIGHT = 235.896;
/** x of the notch centre, i.e. where the fold sits */
const MOBILE_ART_FOLD_X = 193.612;
/** Portrait-space QR and text placement, in art units */
const MOBILE_ART_QR = { left: 53.15, top: 54 };
const MOBILE_ART_TEXT = { left: 30.35, width: 197.784 };

/** Stars placed on the mobile art: bounding box, then the rotated star and its glow overflow */
const MOBILE_ART_STARS = [
  {
    name: "spiral",
    left: 118.83,
    top: 149,
    boxW: 50.744,
    boxH: 50.374,
    w: 37.462,
    h: 38.258,
    rotate: 64.22,
    inset: "-17.96% -18.9% -17.66% -17.64%",
  },
  {
    name: "five-point",
    left: 5.92,
    top: 11,
    boxW: 31.659,
    boxH: 33.73,
    w: 26.977,
    h: 23.212,
    rotate: 67.89,
    inset: "-70.37% -72.39% -68.79% -69.11%",
  },
  {
    name: "circle",
    left: 65.57,
    top: 213,
    boxW: 7,
    boxH: 7,
    w: 7,
    h: 7,
    rotate: 90,
    inset: "-179.59%",
  },
  {
    name: "four-point",
    left: 385.09,
    top: 3,
    boxW: 50.481,
    boxH: 49.834,
    w: 33.922,
    h: 37.575,
    rotate: 127.8,
    inset: "-37.7% -40.09% -41.11% -42.02%",
  },
  {
    name: "eight-point",
    left: 216.21,
    top: 69,
    boxW: 31.365,
    boxH: 31.085,
    w: 21.624,
    h: 23,
    rotate: 53.28,
    inset: "-38.23% -35.37% -37.12% -36.15%",
  },
  {
    name: "drop",
    left: 367.53,
    top: 198,
    boxW: 13.048,
    boxH: 15,
    w: 15,
    h: 13.048,
    rotate: 90,
    inset: "-83.6% -80.68% -84.82% -76.77%",
  },
];

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

  // Pronouns set on the social profile (`Socials/{uid}`) take precedence over the application's
  const [socialPronouns, setSocialPronouns] = useState<string | null>(null);
  useEffect(() => {
    if (!applicant?._id) return;
    let cancelled = false;
    fetchSocial(applicant._id)
      .then((social) => {
        if (!cancelled) setSocialPronouns(social?.pronouns?.trim() || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [applicant?._id]);
  const pronouns = socialPronouns
    ? `(${socialPronouns})`
    : formatApplicationPronouns(
        applicant?.basicInfo?.pronouns,
        applicant?.basicInfo?.otherPronouns,
      );

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
  const useMobileArt = isMobile && HACKATHONS_WITH_MOBILE_TICKET_ART.has(activeHackathon);
  const svgWidth = isMobile ? height : Math.min(width, availableWidth);
  // Art units -> px for the mobile art (its landscape height becomes the portrait width)
  const artScale = svgWidth / MOBILE_ART_HEIGHT;
  const svgHeight = useMobileArt
    ? MOBILE_ART_WIDTH * artScale
    : isMobile
      ? height + height * 0.7
      : svgWidth * desktopAspectRatio;
  const foldY = useMobileArt
    ? (MOBILE_ART_WIDTH - MOBILE_ART_FOLD_X) * artScale
    : isMobile
      ? height
      : undefined;

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
          {useMobileArt ? (
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 left-0"
              style={{
                width: MOBILE_ART_WIDTH,
                height: MOBILE_ART_HEIGHT,
                transformOrigin: "0 0",
                transform: `translateY(${svgHeight}px) rotate(-90deg) scale(${artScale})`,
              }}
            >
              <img
                className="absolute inset-0 block size-full"
                draggable={false}
                src={`/assets/${activeHackathon}/ticket/mobile/background.svg`}
                alt=""
              />
              {MOBILE_ART_STARS.map((star) => (
                <div
                  key={star.name}
                  className="absolute flex items-center justify-center"
                  style={{ left: star.left, top: star.top, width: star.boxW, height: star.boxH }}
                >
                  <div
                    className="relative flex-none"
                    style={{
                      width: star.w,
                      height: star.h,
                      transform: `rotate(${star.rotate}deg)`,
                    }}
                  >
                    <div className="absolute" style={{ inset: star.inset }}>
                      <img
                        className="block size-full max-w-none"
                        draggable={false}
                        src={`/assets/${activeHackathon}/ticket/mobile/${star.name}.svg`}
                        alt=""
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
          )}

          {/* Content overlay */}
          <div className={cn("absolute inset-0 flex", isMobile ? "flex-col-reverse" : "flex-row")}>
            {!useMobileArt && HACKATHONS_WITH_TICKET_LOGO.has(activeHackathon) && (
              <img
                className="absolute top-8 left-7 h-auto w-8"
                style={{ zIndex: 20, pointerEvents: "none" }}
                draggable={false}
                src={`/assets/${activeHackathon}/ticket/logo.svg`}
                alt=""
              />
            )}
            {!isMobile && HACKATHONS_WITH_TICKET_DECAL.has(activeHackathon) && (
              <div
                className="flex h-full flex-col justify-end"
                style={{
                  pointerEvents: "none",
                  maxWidth: `${(foldX / width) * svgWidth}px`,
                }}
              >
                <img
                  className="block h-full"
                  draggable={false}
                  src={`/assets/${activeHackathon}/ticket/ticket-decal.svg`}
                  style={{
                    maxWidth: "100%",
                    objectFit: "contain",
                    objectPosition: "bottom left",
                  }}
                />
              </div>
            )}

            <div
              className={cn(
                "flex h-full flex-col",
                isMobile ? "justify-center" : "justify-end",
                isMobile && !useMobileArt && "items-center",
              )}
              style={{
                zIndex: 20,
                pointerEvents: "none",
                height: isMobile ? `${svgHeight - (foldY ?? 0)}px` : "100%",
                maxWidth: isMobile ? "100%" : `${(foldX / width) * svgWidth}px`,
              }}
            >
              <div
                className={cn(
                  "flex flex-col gap-2",
                  isMobile
                    ? !useMobileArt && "px-14"
                    : "-translate-y-1/2 absolute top-1/2 left-50 p-8",
                )}
                style={{
                  ...(useMobileArt && {
                    marginLeft: MOBILE_ART_TEXT.left * artScale,
                    width: MOBILE_ART_TEXT.width * artScale,
                  }),
                  fontFamily: selectedFont ?? "var(--font-mono)",
                  color: "var(--ticket-hacker-text)",
                }}
              >
                <Badge className="border-border-subtle bg-ticket-role-button-border text-ticket-role-text uppercase">
                  Hacker
                </Badge>
                <div className="flex flex-col">
                  <div className={cn("font-bold", isMobile ? "text-3xl" : "text-4xl")}>
                    {getFullName(applicant)}
                  </div>
                  <div className="max-w-[75%] break-words">{pronouns}</div>
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
                isMobile
                  ? cn("aspect-square h-auto w-full", useMobileArt ? "items-start" : "p-10")
                  : "absolute top-0 right-0 p-14",
              )}
              style={{
                zIndex: 20,
                pointerEvents: "none",
                height: isMobile ? foldY : svgHeight,
                width: isMobile ? undefined : svgHeight,
                ...(useMobileArt && {
                  paddingTop: MOBILE_ART_QR.top * artScale,
                  paddingInline: MOBILE_ART_QR.left * artScale,
                }),
              }}
            >
              <QRCode
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox="0 0 256 256"
                value={qrData ?? ""}
                bgColor="rgba(0,0,0,0)"
                fgColor="var(--ticket-qr-code)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
