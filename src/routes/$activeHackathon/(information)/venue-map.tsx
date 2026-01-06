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

function RouteComponent() {
  const { activeHackathon } = useHackathon();
  const isMobile = useIsMobile();

  return (
    <GradientBackground gradientPosition="bottomMiddle">
      <Container>
        <Tabs defaultValue="main">
          <TabsList className="relative">
            <TabsTrigger value="main">Main {!isMobile && "venue"}</TabsTrigger>
            <TabsTrigger value="ceremonies">Ceremonies {!isMobile && "venue"}</TabsTrigger>
          </TabsList>
          <TabsContent value="main">
            <ImageViewer
              className="-mt-11"
              height={isMobile ? "80vh" : undefined}
              src={`/assets/${activeHackathon}/maps/venue.png`}
            />
          </TabsContent>
          <TabsContent value="ceremonies">
            <ImageViewer
              className="-mt-11"
              height="90vh"
              src={`/assets/${activeHackathon}/maps/ceremonies.png`}
            />
          </TabsContent>
        </Tabs>
      </Container>
    </GradientBackground>
  );
}
