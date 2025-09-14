import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$hackathon/(information)/faqs")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/$hackathon/information/faqs"!</div>;
}
