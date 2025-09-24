import { AppSidebarLayout } from "@/components/layout/app-sidebar";
import { VALID_HACKATHONS } from "@/lib/constants";
import type { HackathonInfoItem } from "@/lib/types";
import { fetchLatestHackathons } from "@/services/latest-hackathons";
import { Outlet, createFileRoute, notFound, useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon")({
  /**
   * Validates the `activeHackathon` URL segment, runs before beforeLoad
   *
   * @param p - route params containing `activeHackathon`
   * @returns an object with the validated, lowercased `activeHackathon` slug
   * @throws when `activeHackathon` is not a valid value (handled by `onError`)
   */
  parseParams: (p) => {
    return {
      activeHackathon: VALID_HACKATHONS.parse(p.activeHackathon.toLowerCase()),
    };
  },
  /**
   * Converts parameter-parse failures into a 404 response
   *
   * @param error - error raised during route processing
   * @throws `notFound()` if the `activeHackathon` is not valid
   */
  onError: (error) => {
    if (error?.routerCode === "PARSE_PARAMS") throw notFound();
  },
  /**
   * Preloads the active hackathon config from Firestore before rendering children
   */
  loader: async ({ params }) => {
    const { activeHackathon } = params;
    const data = await fetchLatestHackathons(activeHackathon);
    if (!data) throw new Error("Hackathon config not found");

    return data satisfies HackathonInfoItem;
  },
  /**
   * To prevent fetching the hackathon config too often
   */
  staleTime: 1000 * 60 * 60,
  component: RouteComponent,
});

function RouteComponent() {
  const hideSidebar = useRouterState({
    select: (state) => state.matches.some((match) => match.staticData?.hideSidebar === true),
  });

  if (hideSidebar) {
    return <Outlet />;
  }

  return (
    <AppSidebarLayout>
      <Outlet />
    </AppSidebarLayout>
  );
}
