import { usePortalStore } from "@/lib/stores/portal-store";

export const usePortalTheme = () => {
  const portalTheme = usePortalStore((state) => state.hackathonTheme);
  return portalTheme ?? null;
};
