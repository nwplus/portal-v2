import { Stampbook } from "@/components/features/stampbook/stampbook";
import { GradientBackground } from "@/components/layout/gradient-background";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useHackerStore } from "@/lib/stores/hacker-store";
import { getPreferredName } from "@/lib/utils";
import { fetchPastHackathonIds, loadStampbook, unlockStampById } from "@/services/stampbook";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { History } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/$activeHackathon/_auth/(account)/stampbook/")({
  validateSearch: (search) => ({
    unlockStamp: (search.unlockStamp as string) || undefined,
  }),
  loaderDeps: ({ search }) => ({ unlockStamp: search.unlockStamp }),
  loader: async ({ context, deps }) => {
    const { dbCollectionName } = context;
    const { user } = useAuthStore.getState();
    const uid = user?.uid;

    if (!dbCollectionName || !uid) {
      return {
        stamps: [],
        preferredName: "User",
        unlockedStampName: undefined,
        hasPastStampbooks: false,
      };
    }

    let unlockedStampName: string | undefined;
    if (deps.unlockStamp) {
      const result = await unlockStampById(uid, deps.unlockStamp, dbCollectionName);
      if (result.success) {
        unlockedStampName = result.stampName;
      }
    }

    const hacker = useHackerStore.getState().hacker;
    const [stamps, pastHackathonIds] = await Promise.all([
      loadStampbook(uid, dbCollectionName),
      fetchPastHackathonIds(uid, dbCollectionName),
    ]);
    const preferredName = hacker ? getPreferredName(hacker) : "User";

    return {
      stamps,
      preferredName,
      unlockedStampName,
      hasPastStampbooks: pastHackathonIds.length > 0,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { stamps, preferredName, unlockedStampName, hasPastStampbooks } = Route.useLoaderData();
  const { activeHackathon } = Route.useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (unlockedStampName) {
      toast.success(`"🎉 ${unlockedStampName}" stamp unlocked!`);

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
      <div className="flex min-h-full flex-col items-center justify-center">
        <Stampbook stamps={stamps} displayName={preferredName} />
        {hasPastStampbooks && (
          <Link
            to="/$activeHackathon/stampbook/$hackathon"
            params={{ activeHackathon, hackathon: "latest" }}
            className="my-4 flex items-center gap-2 rounded-full border border-border-subtle bg-bg-button-secondary px-4 py-2 text-sm text-text-primary transition-all hover:opacity-80"
          >
            <History size={16} />
            View past stampbooks
          </Link>
        )}
      </div>
    </GradientBackground>
  );
}
