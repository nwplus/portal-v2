import { Container } from "@/components/layout/container";
import { GradientBackground } from "@/components/layout/gradient-background";
import { createFileRoute } from "@tanstack/react-router";

import { ImageViewer } from "@/components/ui/image-viewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHackathon } from "@/hooks/use-hackathon";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/$activeHackathon/(information)/venue-map")({
  component: RouteComponent,
});

interface VenueMapTab {
  id: string;
  getTriggerLabel: (isMobile: boolean) => string;
  image: {
    file: string;
    mobileHeight?: string;
    desktopHeight?: string;
  };
}

const MAP_TABS: VenueMapTab[] = [
  {
    id: "main",
    getTriggerLabel: () => "Day 1",
    image: { file: "day1.jpg", mobileHeight: "80vh" },
  },
  {
    id: "ceremonies",
    getTriggerLabel: () => "Day 2",
    image: { file: "day2.jpg", mobileHeight: "80vh" },
  },
];

function RouteComponent() {
  const { activeHackathon } = useHackathon();
  const isMobile = useIsMobile();

  return (
    <GradientBackground gradientPosition="bottomMiddle">
      <Container>
        <Tabs defaultValue={MAP_TABS[0].id}>
          <TabsList className="relative">
            {MAP_TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.getTriggerLabel(isMobile)}
              </TabsTrigger>
            ))}
          </TabsList>
          {MAP_TABS.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              <ImageViewer
                className="-mt-11"
                height={isMobile ? tab.image.mobileHeight : tab.image.desktopHeight}
                src={`/assets/${activeHackathon}/maps/${tab.image.file}`}
              />
            </TabsContent>
          ))}
        </Tabs>
      </Container>
    </GradientBackground>
  );
}
