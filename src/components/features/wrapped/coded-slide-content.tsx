import { ArchetypeSlide } from "@/components/features/wrapped/archetype-slide";
import { IntroSlide } from "@/components/features/wrapped/intro-slide";
import { StampsSlide } from "@/components/features/wrapped/stamps-slide";
import { SummarySlide } from "@/components/features/wrapped/summary-slide";
import type { WrappedDoc } from "@/lib/firebase/types/wrapped";
import type { SlideId } from "@/lib/wrapped/slides";
import type { StampSlot } from "@/lib/wrapped/stamp-slots";
import type { ReactNode } from "react";

/**
 * The coded slides, by id. Shared by the deck and the slide exporter so a saved image
 * is drawn by exactly the component the hacker watched.
 *
 * @param summaryAction - rendered under the summary's sign-off (the share button)
 * @param skipRocketEntrance - the intro's rocket is already on its pad (the launch
 *   fly-up just played the climb), so its rise-into-view entrance is skipped
 */
export function CodedSlideContent({
  slideId,
  doc,
  stampSlots,
  active,
  skipRocketEntrance = false,
  summaryAction,
}: {
  slideId: SlideId;
  doc: WrappedDoc;
  /** The stamps slide's stampbook, built when the deck was loaded. */
  stampSlots: StampSlot[];
  active: boolean;
  skipRocketEntrance?: boolean;
  summaryAction?: ReactNode;
}) {
  switch (slideId) {
    case "intro":
      return (
        <IntroSlide event={doc.event} active={active} skipRocketEntrance={skipRocketEntrance} />
      );
    case "stamps":
      return <StampsSlide slots={stampSlots} active={active} />;
    case "archetype":
      return <ArchetypeSlide archetype={doc.archetype} active={active} />;
    case "summary":
      return (
        <SummarySlide
          data={{ hackathon: doc.summary.event }}
          active={active}
          action={summaryAction}
        />
      );
    default:
      return null;
  }
}
