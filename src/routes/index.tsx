import { SelectPortal } from "@/components/layout/select-portal";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="flex min-h-screen">
      {isAuthenticated ? (
        <SelectPortal />
      ) : (
        <Link
          to="/$activeHackathon/login"
          params={{ activeHackathon: "hackcamp" }}
          search={{ redirect: "/" }}
        >
          Login
        </Link>
      )}
    </div>
  );
}
