import { useAuthStore } from "@/lib/stores/auth-store";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Utility that waits for auth state to finish loading before proceeding.
 * @returns a promise that resolves when auth is finished loading
 */
const loadAuth = () => {
  const { loading } = useAuthStore.getState();
  if (!loading) {
    return;
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      resolve(undefined);
    }, 15000);

    const unsubscribe = useAuthStore.subscribe((state) => {
      if (!state.loading) {
        clearTimeout(timeout);
        unsubscribe();
        resolve(undefined);
      }
    });
  });
};

export const Route = createFileRoute("/$activeHackathon/_auth")({
  beforeLoad: async ({ location }) => {
    await loadAuth();

    const { isAuthenticated } = useAuthStore.getState();

    if (!isAuthenticated) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: () => <Outlet />,
});
