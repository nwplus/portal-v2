import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$hackathon/(account)/rewards")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/$hackathon/(account)/rewards"!</div>;
}
