import { GradientBackground } from "@/components/layout/gradient-background";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/(information)/schedule")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <GradientBackground gradientPosition="topLeft">
      Hello "/$activeHackathon/(information)/schedule"!
    </GradientBackground>
  );
}
