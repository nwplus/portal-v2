import { ArchetypeSlide } from "@/components/features/wrapped/archetype-slide";
import { ComparisonSlide } from "@/components/features/wrapped/comparison-slide";
import { IntroSlide } from "@/components/features/wrapped/intro-slide";
import { StampsSlide } from "@/components/features/wrapped/stamps-slide";
import { SummarySlide } from "@/components/features/wrapped/summary-slide";
import type { WrappedDoc } from "@/lib/firebase/types/wrapped";
import type { SlideId } from "@/lib/wrapped/slides";
import type { ReactNode } from "react";

/**
 * The coded slides, by id. Shared by the deck and the slide exporter so a saved image
 * is drawn by exactly the component the hacker watched.
 *
 * @param summaryAction - rendered under the summary's sign-off (the share button)
 */
export function CodedSlideContent({
  slideId,
  doc,
  active,
  summaryAction,
}: {
  slideId: SlideId;
  doc: WrappedDoc;
  active: boolean;
  summaryAction?: ReactNode;
}) {
  switch (slideId) {
    case "intro":
      return <IntroSlide event={doc.event} active={active} />;
    case "stamps":
      return <StampsSlide stamps={doc.showedUp.stamps} active={active} />;
    case "comparison":
      return <ComparisonSlide comparison={doc.crossHackerComparison} active={active} />;
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
