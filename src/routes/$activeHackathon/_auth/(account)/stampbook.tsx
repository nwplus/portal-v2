import { GradientBackground } from "@/components/layout/gradient-background";
import { useAuthStore } from "@/lib/stores/auth-store";
import { loadStampbook } from "@/services/stampbook";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/_auth/(account)/stampbook")({
  loader: async ({ context }) => {
    const { dbCollectionName } = context;
    const user = useAuthStore.getState().user;

    if (!dbCollectionName || !user?.uid) {
      return { stamps: [] };
    }

    const stamps = await loadStampbook(user.uid, dbCollectionName);
    return { stamps };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { stamps } = Route.useLoaderData();

  return (
    <GradientBackground gradientPosition="bottomMiddle">
      {JSON.stringify(stamps)}
    </GradientBackground>
  );
}
