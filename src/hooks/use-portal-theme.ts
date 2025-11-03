import type { HackathonPortalThemeEntry } from "@/lib/firebase/types";
import { usePortalStore } from "@/lib/stores/portal-store";

type HackathonPortalTheme = Record<string, HackathonPortalThemeEntry>;

export const usePortalTheme = () => {
  const portalTheme = usePortalStore(
    (state) => state.hackathonTheme,
  ) as unknown as HackathonPortalTheme;
  return portalTheme ?? null;
};
