import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/(information)/venue-map")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/$activeHackathon/(information)/venue-map"!</div>;
}
