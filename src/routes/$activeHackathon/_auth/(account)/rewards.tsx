import { GradientBackground } from "@/components/layout/gradient-background";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/_auth/(account)/rewards")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <GradientBackground gradientPosition="bottomMiddle">
      Hello "/$activeHackathon/_auth/(account)/rewards"!
    </GradientBackground>
  );
}
