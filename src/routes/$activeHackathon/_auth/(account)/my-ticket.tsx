import { Countdown } from "@/components/features/my-ticket/countdown";
import { Message } from "@/components/features/my-ticket/message";
import { Ticket } from "@/components/features/my-ticket/ticket";
import { GradientBackground } from "@/components/layout/gradient-background";
import { useAuthStore } from "@/lib/stores/auth-store";
import { fetchApplicant } from "@/services/applicants";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/_auth/(account)/my-ticket")({
  loader: async ({ context }) => {
    const { dbCollectionName } = context;
    const { user } = useAuthStore.getState();
    if (!user?.uid || !dbCollectionName) {
      return { applicant: null };
    }
    const applicant = await fetchApplicant(dbCollectionName, user.uid);
    return { applicant };
  },
  component: () => <RouteComponent />,
});

function RouteComponent() {
  const { applicant } = Route.useLoaderData();

  return (
    <GradientBackground gradientPosition="bottomMiddle">
      <div className="flex flex-col gap-10 py-10 md:py-12">
        <Countdown />
        <Message applicant={applicant} />
        <Ticket applicant={applicant} />
      </div>
    </GradientBackground>
  );
}
