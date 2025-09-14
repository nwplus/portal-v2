import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$hackathon/(information)/schedule")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/$hackathon/information/schedule"!</div>;
}
