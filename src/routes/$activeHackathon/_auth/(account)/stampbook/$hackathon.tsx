import { Stampbook } from "@/components/features/stampbook/stampbook";
import { StampbookActions } from "@/components/features/stampbook/stampbook-actions";
import { GradientBackground } from "@/components/layout/gradient-background";
import { Dropdown } from "@/components/ui/dropdown";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useHackerStore } from "@/lib/stores/hacker-store";
import { getPreferredName } from "@/lib/utils";
import { fetchPastHackathonIds, loadPastStampbook } from "@/services/stampbook";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/$activeHackathon/_auth/(account)/stampbook/$hackathon")({
  loader: async ({ context, params }) => {
    const { dbCollectionName } = context;
    const { user } = useAuthStore.getState();
    const uid = user?.uid;

    if (!dbCollectionName || !uid) {
      return { pastHackathonIds: [], stamps: [], preferredName: "User", selectedHackathon: "" };
    }

    const pastHackathonIds = await fetchPastHackathonIds(uid, dbCollectionName);

    const selectedHackathon =
      params.hackathon === "latest" ? (pastHackathonIds[0] ?? "") : params.hackathon;

    const stamps = selectedHackathon ? await loadPastStampbook(uid, selectedHackathon) : [];

    const hacker = useHackerStore.getState().hacker;
    const preferredName = hacker ? getPreferredName(hacker) : "User";

    return { pastHackathonIds, stamps, preferredName, selectedHackathon };
  },
  component: RouteComponent,
});

function formatHackathonName(hackathonId: string): string {
  const lower = hackathonId.toLowerCase();

  if (lower.includes("nwhacks")) {
    const year = hackathonId.match(/\d{4}/)?.[0] ?? "";
    return `nwHacks ${year}`;
  }
  if (lower.includes("cmd-f")) {
    const year = hackathonId.match(/\d{4}/)?.[0] ?? "";
    return `cmd-f ${year}`;
  }
  if (lower.includes("hackcamp")) {
    const year = hackathonId.match(/\d{4}/)?.[0] ?? "";
    return `HackCamp ${year}`;
  }

  return hackathonId;
}

function RouteComponent() {
  const { pastHackathonIds, stamps, preferredName, selectedHackathon } = Route.useLoaderData();
  const { activeHackathon } = Route.useParams();
  const navigate = useNavigate();

  if (pastHackathonIds.length === 0) {
    return (
      <GradientBackground gradientPosition="bottomMiddle">
        <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6">
          <p className="text-center text-text-secondary">No stampbooks from past hackathons yet.</p>
          <Link
            to="/$activeHackathon/stampbook"
            params={{ activeHackathon }}
            search={{ unlockStamp: undefined }}
            className="text-text-accent hover:underline"
          >
            Back to current stampbook
          </Link>
        </div>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground gradientPosition="bottomMiddle">
      <div className="flex min-h-full flex-col items-center justify-center gap-6 py-8">
        <div className="flex w-full max-w-4xl items-center justify-between px-6">
          <Link
            to="/$activeHackathon/stampbook"
            params={{ activeHackathon }}
            search={{ unlockStamp: undefined }}
            className="flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            <ArrowLeft size={16} />
            Back to current stampbook
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-44">
              <Dropdown
                items={pastHackathonIds}
                value={selectedHackathon}
                onValueChange={(value) => {
                  if (!value) return;
                  navigate({
                    to: "/$activeHackathon/stampbook/$hackathon",
                    params: { activeHackathon, hackathon: value },
                  });
                }}
                itemToString={formatHackathonName}
                readOnly
                placeholder="Select hackathon"
              />
            </div>
            <StampbookActions
              stamps={stamps}
              displayName={preferredName}
              hackathonId={selectedHackathon}
            />
          </div>
        </div>
        <Stampbook stamps={stamps} displayName={preferredName} />
      </div>
    </GradientBackground>
  );
}
