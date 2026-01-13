import { useAuthStore } from "@/lib/stores/auth-store";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/_auth/(account)/social-profile/")({
  beforeLoad: async ({ params }) => {
    const { user } = useAuthStore.getState();

    if (user?.uid) {
      throw redirect({
        to: "/$activeHackathon/social-profile/$userId",
        params: {
          activeHackathon: params.activeHackathon,
          userId: user.uid,
        },
      });
    }
  },
  component: () => null,
});
