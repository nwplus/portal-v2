import { Stampbook } from "@/components/features/stampbook/stampbook";
import { GradientBackground } from "@/components/layout/gradient-background";
import { useHackerStore } from "@/lib/stores/hacker-store";
import { getPreferredName } from "@/lib/utils";
import { loadStampbook, unlockStampById } from "@/services/stampbook";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/$activeHackathon/_auth/(account)/stampbook")({
  validateSearch: (search) => ({
    unlockStamp: (search.unlockStamp as string) || undefined,
  }),
  loaderDeps: ({ search }) => ({ unlockStamp: search.unlockStamp }),
  loader: async ({ context, deps }) => {
    const { dbCollectionName } = context;
    const { hacker, uid } = useHackerStore.getState();

    if (!dbCollectionName || !uid) {
      return { stamps: [], preferredName: "User", unlockedStampName: undefined };
    }

    // In the case of stamps that must be unlocked through scanning a QR (which holds an id query param), unlock the stamp
    let unlockedStampName: string | undefined;
    if (deps.unlockStamp) {
      const result = await unlockStampById(uid, deps.unlockStamp, dbCollectionName);
      if (result.success) {
        unlockedStampName = result.stampName;
      }
    }

    const stamps = await loadStampbook(uid, dbCollectionName);
    const preferredName = hacker ? getPreferredName(hacker) : "User";

    return { stamps, preferredName, unlockedStampName };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { stamps, preferredName, unlockedStampName } = Route.useLoaderData();
  const { activeHackathon } = Route.useParams();
  const navigate = useNavigate();

  // Show notification toast and clear URL param when stamp is unlocked
  useEffect(() => {
    if (unlockedStampName) {
      toast.success(
        `"🎉 ${unlockedStampName}" stamp unlocked!`,
      );

      navigate({
        to: "/$activeHackathon/stampbook",
        params: { activeHackathon },
        search: { unlockStamp: undefined },
        replace: true,
      });
    }
  }, [unlockedStampName, navigate, activeHackathon]);

  return (
    <GradientBackground gradientPosition="bottomMiddle">
      <div className="flex min-h-full items-center justify-center">
        <Stampbook stamps={stamps} displayName={preferredName} />
      </div>
    </GradientBackground>
  );
}
