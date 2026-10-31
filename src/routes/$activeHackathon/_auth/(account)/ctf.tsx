import { ChallengeCard } from "@/components/features/ctf/challenge-card";
import { CtfSummary } from "@/components/features/ctf/ctf-summary";
import { FlagForm } from "@/components/features/ctf/flag-form";
import { GradientBackground } from "@/components/layout/gradient-background";
import { useHackathon } from "@/hooks/use-hackathon";
import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import {
  describeSubmitError,
  describeSubmitResult,
  flagPlaceholder,
  sortChallenges,
} from "@/lib/ctf";
import type { CtfChallenge, CtfSolve } from "@/lib/firebase/types/ctf";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useHackerStore } from "@/lib/stores/hacker-store";
import { usePortalStore } from "@/lib/stores/portal-store";
import { fireSideCannons } from "@/lib/utils";
import { submitCtfFlag, subscribeToCtfChallenges, subscribeToOwnCtfSolves } from "@/services/ctf";
import { fetchStamps } from "@/services/stampbook";
import { createFileRoute, redirect } from "@tanstack/react-router";
import type { FirestoreError } from "firebase/firestore";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/$activeHackathon/_auth/(account)/ctf")({
  beforeLoad: async ({ params, context }) => {
    const { isAdmin } = useAuthStore.getState();
    const ctfOpen = usePortalStore.getState().ctfOpen?.[params.activeHackathon] ?? false;
    if (!ctfOpen && !isAdmin) {
      throw redirect({
        to: "/$activeHackathon",
        params: { activeHackathon: params.activeHackathon },
      });
    }
    if (!isAdmin) {
      const uid = useAuthStore.getState().user?.uid;
      if (uid) {
        const applicant = await useHackerStore.getState().getOrFetch(context.dbCollectionName, uid);
        if (applicant?.status?.applicationStatus !== "acceptedAndAttending") {
          throw redirect({
            to: "/$activeHackathon/application",
            params: { activeHackathon: params.activeHackathon },
          });
        }
      }
    }
  },
  loader: async ({ context }) => {
    const stamps = await fetchStamps(context.dbCollectionName);
    const stampImages: Record<string, string> = Object.fromEntries(
      stamps.map((stamp) => [stamp._id, stamp.imgURL]),
    );
    return { stampImages };
  },
  component: RouteComponent,
});

const onSubscriptionError = (error: FirestoreError) => {
  console.error("CTF subscription failed:", error);
  toast.error("Couldn't load the CTF. Try refreshing.", { id: "ctf-load-error" });
};

function RouteComponent() {
  const { stampImages } = Route.useLoaderData();
  const { activeHackathon } = useHackathon();
  const { dbCollectionName, hackathonYear } = useHackathonInfo();
  const uid = useAuthStore((state) => state.user?.uid);
  const [challenges, setChallenges] = useState<CtfChallenge[]>([]);
  const [solves, setSolves] = useState<CtfSolve[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(
    () => subscribeToCtfChallenges(dbCollectionName, setChallenges, onSubscriptionError),
    [dbCollectionName],
  );

  useEffect(() => {
    if (!uid) return;
    return subscribeToOwnCtfSolves(dbCollectionName, uid, setSolves, onSubscriptionError);
  }, [dbCollectionName, uid]);

  const handleSubmit = async (flag: string): Promise<boolean> => {
    setSubmitting(true);
    try {
      const result = await submitCtfFlag(dbCollectionName, flag);
      const titles = Object.fromEntries(
        challenges.map((challenge) => [challenge._id, challenge.title ?? `Day ${challenge.order}`]),
      );
      const feedback = describeSubmitResult(result, titles);

      if (feedback.tone === "success") {
        fireSideCannons(activeHackathon);
        toast.success(feedback.message);
        return true;
      }
      if (feedback.tone === "info") {
        toast.info(feedback.message);
      } else {
        toast.error(feedback.message);
      }
      return false;
    } catch (error) {
      toast.error(describeSubmitError((error as { code?: string }).code));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const solvesByChallenge = new Map(solves.map((solve) => [solve.challengeId, solve]));

  return (
    <GradientBackground gradientPosition="bottomMiddle">
      <div className="mx-auto flex min-h-full max-w-3xl flex-col gap-8 px-6 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="font-semibold text-3xl text-text-primary md:text-4xl">CTF</h1>
          <p className="text-sm text-text-secondary md:text-base">
            New challenges open over the week. Each flag works once, and the faster you solve a
            challenge, the more points you earn. Every point is a raffle entry, and every solve
            unlocks a stamp.
          </p>
        </div>
        <CtfSummary solves={solves} challengeCount={challenges.length} />
        <FlagForm
          submitting={submitting}
          placeholder={flagPlaceholder(activeHackathon, hackathonYear)}
          onSubmit={handleSubmit}
        />
        <div className="grid gap-4 md:grid-cols-2">
          {sortChallenges(challenges).map((challenge) => (
            <ChallengeCard
              key={challenge._id}
              challenge={challenge}
              solve={solvesByChallenge.get(challenge._id)}
              stampImgURL={stampImages[challenge.stampId]}
            />
          ))}
        </div>
      </div>
    </GradientBackground>
  );
}
