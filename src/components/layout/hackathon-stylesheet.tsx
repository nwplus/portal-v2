import { useHackathon } from "@/hooks/use-hackathon";
import { usePortalTheme } from "@/hooks/use-portal-theme";

export const HackathonStylesheet = () => {
  const { activeHackathon } = useHackathon();
  const portalTheme = usePortalTheme();
  const s = portalTheme[activeHackathon];

  const bottomMiddleGradient = s?.backgroundGradients?.bottomMiddle;
  const bottomRightGradient = s?.backgroundGradients?.bottomRight;
  const topMiddleGradient = s?.backgroundGradients?.topMiddle;
  const topLeftGradient = s?.backgroundGradients?.topLeft;

  return (
    <style>{`
      :root {
        ${s?.primary && `--sidebar-accent: ${s.primary};`}
        ${s?.primaryForeground && `--sidebar-accent-foreground: ${s.primaryForeground};`}

        ${s?.primary && `--theme-primary: ${s.primary};`}
        ${s?.secondary && `--theme-secondary: ${s.secondary};`}
        ${s?.tertiary && `--theme-tertiary: ${s.tertiary};`}
        }
        ${bottomMiddleGradient ? `.bg-radial-gradient-bottom-middle { ${bottomMiddleGradient} }` : ""}
        ${bottomRightGradient ? `.bg-radial-gradient-bottom-right { ${bottomRightGradient} }` : ""}
        ${topMiddleGradient ? `.bg-radial-gradient-top-middle { ${topMiddleGradient} }` : ""}
        ${topLeftGradient ? `.bg-radial-gradient-top-left { ${topLeftGradient} }` : ""}
    `}</style>
  );
};
