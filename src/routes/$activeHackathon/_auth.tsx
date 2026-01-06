import { useAuthStore } from "@/lib/stores/auth-store";
import { loadAuth } from "@/lib/utils";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/_auth")({
  beforeLoad: async ({ location, params }) => {
    await loadAuth();
    const { isAuthenticated } = useAuthStore.getState();

    if (!isAuthenticated) {
      // Preserve full URL including search params for post-auth redirect (e.g. ?unlockStamp=xxx)
      // As of now, we use this to enable unlocking stamps through scanning a QR code with the relevant id (query param)
      const redirectUrl = location.search
        ? `${location.pathname}${location.search}`
        : location.pathname;

      throw redirect({
        to: "/$activeHackathon/login",
        params: {
          activeHackathon: params.activeHackathon,
        },
        search: {
          redirect: redirectUrl,
        },
      });
    }
  },
  component: () => <RouteComponent />,
});

function RouteComponent() {
  return <Outlet />;
}
