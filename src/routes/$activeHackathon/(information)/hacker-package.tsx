import { GradientBackground } from "@/components/layout/gradient-background";
// import { NoisyBackground } from "@/components/visual/noisy-background";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/(information)/hacker-package")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <GradientBackground gradientPosition="bottomMiddle">
      {/* <NoisyBackground /> */}
      <div className="relative">hi</div>
    </GradientBackground>
  );
}
