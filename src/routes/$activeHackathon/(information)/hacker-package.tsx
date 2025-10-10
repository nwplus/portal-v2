import { NoisyBackground } from "@/components/visual/noisy-background";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/(information)/hacker-package")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="relative h-full">
      <NoisyBackground />
      <div className="relative">hi</div>
    </div>
  );
}
