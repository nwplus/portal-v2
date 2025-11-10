import { GradientBackground } from "@/components/layout/gradient-background";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/(information)/hacker-package")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <GradientBackground gradientPosition="bottomMiddle">
      <div className="relative">hi</div>
    </GradientBackground>
  );
}
