import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/(information)/schedule")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/$activeHackathon/(information)/schedule"!</div>;
}
