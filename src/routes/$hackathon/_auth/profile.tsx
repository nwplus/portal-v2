import { useAuthStore } from "@/lib/stores/auth-store";
import { createFileRoute, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/$hackathon/_auth/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  const user = useAuthStore((state) => state.user);
  const { hackathon } = useParams({ from: "/$hackathon" });

  return (
    <div>
      Hello {user?.email} {hackathon}
    </div>
  );
}
