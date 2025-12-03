import type { HackathonPortalTheme } from "@/lib/firebase/types";
import { usePortalStore } from "@/lib/stores/portal-store";

export const usePortalTheme = () => {
  const portalTheme = usePortalStore(
    (state) => state.hackathonTheme,
  ) as unknown as HackathonPortalTheme;
  return portalTheme ?? null;
};
