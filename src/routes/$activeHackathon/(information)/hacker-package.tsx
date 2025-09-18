import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/(information)/hacker-package")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/$activeHackathon/(information)/hacker-package"!</div>;
}
