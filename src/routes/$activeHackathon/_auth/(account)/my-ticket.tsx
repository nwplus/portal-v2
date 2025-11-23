import { GradientBackground } from "@/components/layout/gradient-background";
import { useHackathon } from "@/hooks/use-hackathon";
import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getSidebarHackathonIcon } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/_auth/(account)/my-ticket")({
  component: RouteComponent,
});

function RouteComponent() {
  const { activeHackathon } = useHackathon();
  const { displayNameShort, hackathonYear } = useHackathonInfo();
  const user = useAuthStore((state) => state.user);
  const HackathonIcon = getSidebarHackathonIcon(activeHackathon);

  return (
    <GradientBackground
      gradientPosition="bottomMiddle"
      className="flex items-center justify-center p-8"
    >
      <div className="flex max-w-2xl flex-col items-center gap-8 text-center">
        <div className="scale-[1.5]">
          <HackathonIcon />
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="font-bold text-4xl text-text-primary">
            {displayNameShort} {hackathonYear}
          </h1>
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-2xl text-text-primary">{user?.displayName}</p>
            <p className="text-lg text-text-secondary">{user?.email}</p>
          </div>
        </div>

        <div className="w-full rounded-lg border border-border-subtle bg-bg-translucent-card p-6">
          <p className="text-text-secondary">
            Placeholder: Your ticket information will appear here closer to the event date.
          </p>
        </div>
      </div>
    </GradientBackground>
  );
}
