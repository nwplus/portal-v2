import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/_auth/application/questionnaire")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/$activeHackathon/_auth/application/questionnaire"!</div>;
}
