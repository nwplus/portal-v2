import { GradientBackground } from "@/components/layout/gradient-background";
import { usePortalStore } from "@/lib/stores/portal-store";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/(information)/hacker-package")({
  component: RouteComponent,
});

function RouteComponent() {
  const { activeHackathon } = Route.useRouteContext();
  const notionLinks = usePortalStore((s) => s.notionLinks);
  const iframeHtml = notionLinks?.[activeHackathon]?.hackerPackageIFrame;

  const srcMatch = iframeHtml?.match(/src="([^"]+)"/);
  const iframeSrc = srcMatch?.[1];

  return (
    <GradientBackground gradientPosition="bottomMiddle">
      <div className="flex h-full w-full items-center justify-center">
        {iframeSrc ? (
          <div className="h-[90%] w-[90%] overflow-hidden rounded-xl">
            <iframe src={iframeSrc} className="h-full w-full" title="Hacker Package" />
          </div>
        ) : (
          <p className="text-text-primary">Hacker package is not available yet</p>
        )}
      </div>
    </GradientBackground>
  );
}
