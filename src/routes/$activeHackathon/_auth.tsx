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
          // preserve full URL for post-auth redirect (e.g. ?unlockStamp=xxx)
          redirect: location.href,
        },
      });
    }
  },
  component: () => <RouteComponent />,
});

function RouteComponent() {
  return <Outlet />;
}
