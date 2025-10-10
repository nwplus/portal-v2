import { usePortalStore } from "@/lib/stores/portal-store";

// TODO: move to the types file (currently being modified by another active PR)
type HackathonPortalTheme = Record<
  string,
  {
    portalGradient?: string[];
    primary?: string;
    primaryForeground?: string;
    secondary?: string;
    secondaryForeground?: string;
    tertiary?: string;
    tertiaryForeground?: string;
  }
>;

export const usePortalTheme = () => {
  const portalTheme = usePortalStore(
    (state) => state.hackathonTheme,
  ) as unknown as HackathonPortalTheme;
  return portalTheme ?? null;
};
