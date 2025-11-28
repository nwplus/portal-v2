import { useAuthStore } from "@/lib/stores/auth-store";
import { loadAuth } from "@/lib/utils";
import { fetchApplicant } from "@/services/applicants";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/_auth")({
  beforeLoad: async ({ location, params, context }) => {
    await loadAuth();
    const { isAuthenticated, user } = useAuthStore.getState();

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

    const isOnApplicationPage = location.pathname.includes("/application");
    const { dbCollectionName } = context;

    if (!isOnApplicationPage && user?.uid && dbCollectionName) {
      const applicant = await fetchApplicant(dbCollectionName, user.uid);

      if (!applicant || !applicant.submission?.submitted) {
        throw redirect({
          to: "/$activeHackathon/application",
          params: {
            activeHackathon: params.activeHackathon,
          },
        });
      }
    }
  },
  component: () => <RouteComponent />,
});

function RouteComponent() {
  return <Outlet />;
}
