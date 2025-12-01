import { GradientBackground } from "@/components/layout/gradient-background";
import { Button } from "@/components/ui/button";
import { useHackathon } from "@/hooks/use-hackathon";
import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getColouredHackathonIcon } from "@/lib/utils";
import { createFileRoute, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/login")({
  staticData: { hideSidebar: true },
  component: RouteComponent,
  validateSearch: (search) => ({
    redirect: search.redirect as string | undefined,
  }),
});

function RouteComponent() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const router = useRouter();
  const search = Route.useSearch();
  const { activeHackathon } = useHackathon();
  const { displayNameFull } = useHackathonInfo();

  const HackathonIcon = getColouredHackathonIcon(activeHackathon);

  const handleSignIn = async () => {
    const redirectTo = search.redirect || "/";
    if (!isAuthenticated) {
      await signInWithGoogle();
    }
    router.history.replace(redirectTo);
  };

  return (
    <GradientBackground gradientPosition="bottomMiddle">
      <div className="flex h-full flex-col items-center justify-center gap-10 pb-32 text-center">
        <div className="flex aspect-square size-16 items-center justify-center rounded-lg">
          <HackathonIcon />
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="font-semibold text-6xl text-text-primary">
            Welcome to
            <br />
            {displayNameFull}
          </h1>
          <p className="font-medium text-lg">We're so glad you're here!</p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <p className="font-medium text-lg">To continue, please sign in below.</p>
          <Button variant="primary" onClick={handleSignIn}>
            Log in with Google
          </Button>
        </div>
      </div>
    </GradientBackground>
  );
}
