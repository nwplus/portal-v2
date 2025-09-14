import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$hackathon/(information)/hacker-package")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/$hackathon/information/hacker-package"!</div>;
}
