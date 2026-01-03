import { useAuthStore } from "@/lib/stores/auth-store";
import { loadAuth } from "@/lib/utils";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/")({
  beforeLoad: async ({ params }) => {
    await loadAuth();
    const { isAuthenticated } = useAuthStore.getState();

    // authenticated users have already passed the parent route's status checks for acceptedAndAttending + portalLive
    if (isAuthenticated) {
      throw redirect({
        to: "/$activeHackathon/my-ticket",
        params: { activeHackathon: params.activeHackathon },
      });
    }

    throw redirect({
      to: "/$activeHackathon/home",
      params: { activeHackathon: params.activeHackathon },
    });
  },
});
