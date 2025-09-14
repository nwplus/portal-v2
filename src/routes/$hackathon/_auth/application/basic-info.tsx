import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$hackathon/_auth/application/basic-info")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/$hackathon/_auth/application/basic-info"!</div>;
}
