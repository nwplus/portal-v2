import { useAuthStore } from "@/lib/stores/auth-store";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$hackathon/(account)/social-profile")({
  component: RouteComponent,
});

function RouteComponent() {
  const user = useAuthStore((state) => state.user);

  return <div>Hello {user?.email}</div>;
}
