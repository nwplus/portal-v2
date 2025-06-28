import { useAuthStore } from "@/lib/stores/auth";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

const awaitAuth = () => {
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

export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ location }) => {
    await awaitAuth();

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
