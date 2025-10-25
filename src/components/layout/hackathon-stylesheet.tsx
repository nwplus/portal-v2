import { useHackathon } from "@/hooks/use-hackathon";
import { usePortalTheme } from "@/hooks/use-portal-theme";

export const HackathonStylesheet = () => {
  const { activeHackathon } = useHackathon();
  const portalTheme = usePortalTheme();
  const s = portalTheme[activeHackathon];

  return (
    <style>{`
      :root {
        ${s?.primary && `--sidebar-accent: ${s.primary};`}
        ${s?.primaryForeground && `--sidebar-accent-foreground: ${s.primaryForeground};`}

        ${s?.primary && `--theme-primary: ${s.primary};`}
        ${s?.secondary && `--theme-secondary: ${s.secondary};`}
        ${s?.tertiary && `--theme-tertiary: ${s.tertiary};`}
      }
    `}</style>
  );
};
