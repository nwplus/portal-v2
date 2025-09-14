import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$hackathon/_auth/application/rsvp")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/$hackathon/_auth/application/rsvp"!</div>;
}
