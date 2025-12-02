import { NoisyBackground } from "@/components/visual/noisy-background";
import { useAuthStore } from "@/lib/stores/auth-store";
import { usePortalStore } from "@/lib/stores/portal-store";
import { loadPortalStore } from "@/lib/utils";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  beforeLoad: async () => {
    await loadPortalStore();
  },
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
      <div className="relative h-svh overflow-hidden bg-background">
        <Outlet />
        {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
        <NoisyBackground className="pointer-events-none z-50" opacity={0.15} />
      </div>
    );
  },
});
