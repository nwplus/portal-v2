import { useAuthStore } from "@/lib/stores/auth"; // No longer need initAuthListener here
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: () => {
    const loading = useAuthStore((state) => state.loading);

    if (loading) {
      return (
        <div className="flex h-screen w-screen items-center justify-center">
          <div>Loading application...</div>
        </div>
      );
    }

    return (
      <>
        <Outlet />
        <TanStackRouterDevtools />
      </>
    );
  },
});
