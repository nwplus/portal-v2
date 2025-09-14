import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$hackathon/_auth/application/skills")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/$hackathon/_auth/application/skills"!</div>;
}
