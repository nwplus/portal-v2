import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/(information)/faqs")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/$activeHackathon/(information)/faqs"!</div>;
}
