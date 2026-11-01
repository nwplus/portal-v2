import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { StampWithUnlockState } from "@/lib/firebase/types/stamps";
import { pointsLabel, stampValueLabel } from "@/lib/stampbook";
import { cn } from "@/lib/utils";
import { PartyPopperIcon, QrCodeIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type StampSize = "sm" | "md";

interface StampDisplayProps {
  stamp: StampWithUnlockState;
  showDetails?: boolean;
  size?: StampSize;
}

const sizeStyles = {
  sm: {
    container: "h-24 w-24",
    image: "h-24 w-24",
    details: "w-full min-w-0",
    name: "text-xs",
    description: "text-[10px]",
    points: "text-[10px]",
    gap: "gap-1",
  },
  md: {
    container: "h-32 w-32",
    image: "h-32 w-32",
    details: "w-full min-w-0",
    name: "text-sm",
    description: "text-xs",
    points: "text-xs",
    gap: "gap-2",
  },
} as const;

export function StampDisplay({ stamp, showDetails = true, size = "md" }: StampDisplayProps) {
  const nameRef = useRef<HTMLSpanElement>(null);
  const descriptionRef = useRef<HTMLSpanElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: remeasure when text or detail visibility changes, even if the fixed box size stays the same
  useEffect(() => {
    const elements = [nameRef.current, descriptionRef.current].filter(
      (element): element is HTMLSpanElement => element !== null,
    );
    const measure = () =>
      setIsTruncated(
        elements.some(
          (element) => element.clientWidth > 0 && element.scrollHeight > element.clientHeight + 1,
        ),
      );
    const observer = new ResizeObserver(measure);
    for (const element of elements) observer.observe(element);
    measure();
    document.fonts.ready.then(measure);
    return () => observer.disconnect();
  }, [stamp.name, stamp.description, showDetails]);
  const imageSrc = stamp.isUnlocked
    ? stamp.imgURL
    : (stamp.lockedImgURL ?? "/assets/stampbook/stamp-locked.svg");
  const styles = sizeStyles[size];
  const valueLabel = stampValueLabel(stamp.pointValue);

  return (
    <div className={cn("flex min-h-0 w-full min-w-0 flex-col items-center", styles.gap)}>
      <div
        className={cn("relative flex items-center justify-center rounded-full", styles.container)}
      >
        <img
          src={imageSrc}
          alt={stamp.isUnlocked ? stamp.name : "Locked stamp"}
          className={cn("rounded-full object-cover transition-all duration-300", styles.image)}
        />
        {valueLabel && (
          // same stampbook paper colours as stampbook-page.tsx and the details text below
          <span
            className={cn(
              "absolute right-0 bottom-0 rounded-full border border-border-stampbook bg-[#F3EBEA] px-1.5 py-0.5 font-mono font-semibold text-[#0a0a0a] leading-none",
              styles.points,
            )}
          >
            <span aria-hidden="true">{valueLabel}</span>
            <span className="sr-only">{pointsLabel(stamp.pointValue ?? 0)}</span>
          </span>
        )}
      </div>

      {showDetails && (
        // TODO: portal is dark-themed; if dark text is re-used, add as a stylesheet token for reskin
        <div
          className={cn(
            "flex min-h-0 flex-col items-center gap-1 font-mono text-[#0a0a0a]",
            styles.details,
          )}
        >
          <span
            ref={nameRef}
            style={{ lineHeight: 1.25 }}
            className={cn(
              "line-clamp-2 h-[2.5em] w-full shrink-0 break-words text-center font-semibold leading-tight",
              styles.name,
            )}
          >
            {stamp.name}
            {stamp.isQRUnlockable && (
              <Tooltip>
                <TooltipTrigger className="ml-2 inline-block align-middle">
                  <QrCodeIcon className="h-4 w-4 text-text-secondary" />
                </TooltipTrigger>
                <TooltipContent>This stamp can be unlocked by scanning a QR code</TooltipContent>
              </Tooltip>
            )}
            {stamp.isEventUnlockable && (
              <Tooltip>
                <TooltipTrigger className="ml-2 inline-block align-middle">
                  <PartyPopperIcon className="h-4 w-4 text-text-secondary" />
                </TooltipTrigger>
                <TooltipContent>
                  Get an organizer to scan your QR after completing this activity!
                </TooltipContent>
              </Tooltip>
            )}
          </span>

          <span
            ref={descriptionRef}
            style={{ lineHeight: 1.25 }}
            className={cn(
              "line-clamp-3 h-[3.75em] w-full shrink-0 break-words text-center leading-tight",
              styles.description,
            )}
          >
            {stamp.description}
          </span>
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label={`View details for ${stamp.name}`}
                className={cn(
                  "min-h-8 shrink-0 rounded px-2 text-xs underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2",
                  !isTruncated && "invisible",
                )}
              >
                View details
              </button>
            </SheetTrigger>
            <SheetContent
              className="w-full overflow-y-auto border-l-0 bg-bg-main text-text-primary sm:max-w-md"
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                headingRef.current?.focus();
              }}
            >
              <SheetHeader className="gap-4 pr-10">
                <SheetTitle ref={headingRef} tabIndex={-1} className="break-words outline-none">
                  {stamp.name}
                </SheetTitle>
                <SheetDescription className="whitespace-pre-wrap break-words text-base">
                  {stamp.description}
                </SheetDescription>
                {valueLabel && <p>{pointsLabel(stamp.pointValue ?? 0)}</p>}
                {stamp.isQRUnlockable && <p>Scan this stamp's QR code to unlock it.</p>}
                {stamp.isEventUnlockable && (
                  <p>Get an organizer to scan your QR after completing this activity!</p>
                )}
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  );
}
