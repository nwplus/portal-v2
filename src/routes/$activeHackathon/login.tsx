import { GradientBackground } from "@/components/layout/gradient-background";
import { useAuthStore } from "@/lib/stores/auth-store";
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

  const handleSignIn = async () => {
    const redirectTo = search.redirect || "/";
    if (!isAuthenticated) {
      await signInWithGoogle();
    }
    router.history.replace(redirectTo);
  };

  return (
    <GradientBackground gradientPosition="bottomMiddle">
      <button type="button" onClick={handleSignIn}>
        Login
      </button>
    </GradientBackground>
  );
}
