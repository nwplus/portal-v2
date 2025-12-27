import { GoogleIcon } from "@/components/icons";
import { GradientBackground } from "@/components/layout/gradient-background";
import { Button } from "@/components/ui/button";
import { useHackathon } from "@/hooks/use-hackathon";
import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getColouredHackathonIcon } from "@/lib/utils";
import { loadAuth } from "@/lib/utils";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/")({
  beforeLoad: async ({ params }) => {
    await loadAuth();
    const { isAuthenticated } = useAuthStore.getState();

    if (isAuthenticated) {
      throw redirect({
        to: "/$activeHackathon/my-ticket",
        params: { activeHackathon: params.activeHackathon },
      });
    }
  },
  component: RouteComponent,
});

/**
 * If the user is authenticated, redirect to the my-ticket page, otherwise redirect to the schedule page
 * The user won't be able to access any of the (account) pages if they're not signed in
 *
 * @param isAuthenticated - whether the user is authenticated
 * @param activeHackathon - the current active hackathon in the URL
 * @returns the appropriate page to redirect to
 */
function RouteComponent() {
  const { activeHackathon } = useHackathon();
  const { displayNameShort, hackathonYear } = useHackathonInfo();
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const navigate = useNavigate();
  const HackathonIcon = getColouredHackathonIcon(activeHackathon);

  const handleSignIn = async () => {
    await signInWithGoogle();
    navigate({ to: "/$activeHackathon/my-ticket", params: { activeHackathon } });
  };

  return (
    <GradientBackground
      gradientPosition="bottomMiddle"
      className="flex items-center justify-center p-4"
    >
      <div className="flex max-w-md flex-col items-center gap-6 text-center md:gap-8">
        <div className="scale-[1.5] md:scale-[2]">
          <HackathonIcon />
        </div>
        <div className="flex flex-col gap-3 md:gap-4">
          <h1 className="font-bold text-3xl text-text-primary md:text-4xl">
            Welcome to
            <br />
            {displayNameShort} {hackathonYear}
          </h1>
          <p className="text-base text-text-primary md:text-md">
            If you are a hacker, sign in below to view your account.
          </p>
        </div>
        <Button variant="login" size="lg" className="gap-3" onClick={handleSignIn}>
          <GoogleIcon />
          Log in with Google
        </Button>
      </div>
    </GradientBackground>
  );
}
