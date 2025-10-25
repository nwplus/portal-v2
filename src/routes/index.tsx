import { SelectPortal } from "@/components/layout/select-portal";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex min-h-screen">
      <SelectPortal />
    </div>
  );
}
