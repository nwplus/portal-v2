import { Stampbook } from "@/components/features/stampbook/stampbook";
import { GradientBackground } from "@/components/layout/gradient-background";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useHackerStore } from "@/lib/stores/hacker-store";
import { getPreferredName } from "@/lib/utils";
import { loadStampbook } from "@/services/stampbook";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/_auth/(account)/stampbook")({
  loader: async ({ context }) => {
    const { dbCollectionName } = context;
    const user = useAuthStore.getState().user;

    if (!dbCollectionName || !user?.uid) {
      return { stamps: [], preferredName: "User" };
    }

    const [stamps, hacker] = await Promise.all([
      loadStampbook(user.uid, dbCollectionName),
      useHackerStore.getState().getOrFetch(dbCollectionName, user.uid),
    ]);

    const preferredName = hacker ? getPreferredName(hacker) : "User";

    console.log("stamps", stamps);

    return { stamps, preferredName };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { stamps, preferredName } = Route.useLoaderData();

  return (
    <GradientBackground gradientPosition="bottomMiddle">
      <div className="flex min-h-full items-center justify-center">
        <Stampbook stamps={stamps} displayName={preferredName} />
      </div>
    </GradientBackground>
  );
}
