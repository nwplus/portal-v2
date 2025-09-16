import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/_auth/(account)/social-profile")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/$activeHackathon/_auth/(account)/social-profile"!</div>;
}
