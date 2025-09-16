import { useAuthStore } from "@/lib/stores/auth-store";
import { loadAuth } from "@/lib/utils";
import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * If the user is authenticated, redirect to the my-ticket page, otherwise redirect to the schedule page
 * The user won't be able to access any of the (account) pages if they're not signed in
 *
 * @param isAuthenticated - whether the user is authenticated
 * @param activeHackathon - the current active hackathon in the URL
 * @returns the appropriate page to redirect to
 */
const redirectTo = (isAuthenticated: boolean, activeHackathon: string) => {
  return isAuthenticated ? `/${activeHackathon}/my-ticket` : `/${activeHackathon}/schedule`;
};

export const Route = createFileRoute("/$activeHackathon/")({
  beforeLoad: async ({ params }) => {
    await loadAuth();
    const { isAuthenticated } = useAuthStore.getState();

    throw redirect({
      to: redirectTo(isAuthenticated, params.activeHackathon),
      replace: true,
    });
  },
});
