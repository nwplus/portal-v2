import { GoogleIcon } from "@/components/icons";
import { GradientBackground } from "@/components/layout/gradient-background";
import { Button } from "@/components/ui/button";
import { useHackathon } from "@/hooks/use-hackathon";
import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getSidebarHackathonIcon } from "@/lib/utils";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/")({
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
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const navigate = useNavigate();
  const HackathonIcon = getSidebarHackathonIcon(activeHackathon);

  const handleSignIn = async () => {
    if (!isAuthenticated) {
      await signInWithGoogle();
    }
    navigate({ to: "/$activeHackathon/my-ticket", params: { activeHackathon } });
  };

  if (isAuthenticated) {
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
            <p className="text-base text-text-secondary md:text-lg">
              You are signed in. Check out your account in the sidebar.
            </p>
          </div>
        </div>
      </GradientBackground>
    );
  }

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
