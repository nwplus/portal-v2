import { useAuthStore } from "@/lib/stores/auth-store"; // No longer need initAuthListener here
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: () => {
    const loading = useAuthStore((state) => state.loading);

    if (loading) {
      return (
        <div className="fixed inset-0 grid place-items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-500 border-t-transparent" />
        </div>
      );
    }

    return (
      <>
        <Outlet />
        {import.meta.env.DEV && <TanStackRouterDevtools />}
      </>
    );
  },
});
