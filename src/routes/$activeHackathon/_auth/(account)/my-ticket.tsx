import { Countdown } from "@/components/features/my-ticket/countdown";
import { Message } from "@/components/features/my-ticket/message";
import { Ticket } from "@/components/features/my-ticket/ticket";
import { GradientBackground } from "@/components/layout/gradient-background";
import { useHackerStore } from "@/lib/stores/hacker-store";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/_auth/(account)/my-ticket")({
  component: RouteComponent,
});

function RouteComponent() {
  const hacker = useHackerStore((state) => state.hacker);

  if (!hacker) return null;

  return (
    <GradientBackground gradientPosition="bottomMiddle">
      <div className="flex flex-col gap-10 py-10 md:py-12">
        <Countdown />
        <Message applicant={hacker} />
        <Ticket applicant={hacker} />
      </div>
    </GradientBackground>
  );
}
