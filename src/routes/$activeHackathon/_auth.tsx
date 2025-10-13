import { useAuthStore } from "@/lib/stores/auth-store";
import { loadAuth } from "@/lib/utils";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/_auth")({
  beforeLoad: async ({ location, params }) => {
    await loadAuth();
    const { isAuthenticated } = useAuthStore.getState();

    if (!isAuthenticated) {
      throw redirect({
        to: "/$activeHackathon/login",
        params: {
          activeHackathon: params.activeHackathon,
        },
        search: {
          redirect: location.pathname,
        },
      });
    }
  },
  component: () => <RouteComponent />,
});

function RouteComponent() {
  return <Outlet />;
}
