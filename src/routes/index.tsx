import { useAuthStore } from "@/lib/stores/auth-store";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex min-h-screen items-center justify-center">
      {isAuthenticated ? (
        <div className="flex flex-col">
          <button
            type="button"
            onClick={logout}
            className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            Logout {user?.email}
          </button>
        </div>
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
