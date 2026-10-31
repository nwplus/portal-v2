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
  const error = useAuthStore((state) => state.error);
  const loading = useAuthStore((state) => state.loading);
  const router = useRouter();
  const search = Route.useSearch();
  const { activeHackathon } = useHackathon();
  const { displayNameFull } = useHackathonInfo();

  const HackathonIcon = getColouredHackathonIcon(activeHackathon);

  const handleSignIn = async () => {
    const redirectTo = search.redirect || "/";
    if (!isAuthenticated) {
      try {
        await signInWithGoogle();
      } catch {
        // The auth store exposes the failure below; stay on the login page.
        return;
      }
    }
    router.history.replace(redirectTo);
  };

  return (
    <GradientBackground gradientPosition="bottomMiddle">
      <div className="flex h-full flex-col items-center justify-center gap-8 px-6 pb-32 text-center md:gap-10">
        <div className="flex aspect-square size-10 items-center justify-center rounded-lg md:size-16">
          <HackathonIcon />
        </div>

        <div className="flex flex-col gap-2 md:gap-4">
          <h1 className="font-semibold text-3xl text-text-primary md:text-6xl">
            Welcome to
            <br />
            {displayNameFull}
          </h1>
          <p className="font-medium text-sm md:text-lg">We're so glad you're here!</p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <p className="font-medium text-sm md:text-lg">To continue, please sign in below.</p>
          <Button variant="primary" onClick={handleSignIn} disabled={loading}>
            {loading ? "Signing in…" : "Log in with Google"}
          </Button>
          {error && (
            <p role="alert" className="max-w-sm text-sm text-text-primary">
              {error}
              {import.meta.env.DEV &&
                window.location.hostname === "127.0.0.1" &&
                error.includes("auth/unauthorized-domain") && (
                  <>
                    {" "}
                    For local testing, use{" "}
                    <a
                      className="underline underline-offset-2"
                      href={`http://localhost:${window.location.port}${window.location.pathname}${window.location.search}`}
                    >
                      Portal on localhost
                    </a>
                    .
                  </>
                )}
            </p>
          )}
        </div>
      </div>
    </GradientBackground>
  );
}
