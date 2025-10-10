import { useAuthStore } from "@/lib/stores/auth-store"; // No longer need initAuthListener here
import { usePortalStore } from "@/lib/stores/portal-store";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: () => {
    const authLoading = useAuthStore((state) => state.loading);
    const portalLoading = usePortalStore((state) => state.loading);

    if (authLoading || portalLoading) {
      return (
        <div className="fixed inset-0 grid place-items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-500 border-t-transparent" />
        </div>
      );
    }

    return (
      <>
        <Outlet />
        {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
      </>
    );
  },
});
