import { GradientBackground } from "@/components/layout/gradient-background";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/(information)/faqs")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <GradientBackground gradientPosition="bottomMiddle">
      Hello "/$activeHackathon/(information)/faqs"!
    </GradientBackground>
  );
}
