import { AppSidebarLayout } from "@/components/layout/app-sidebar";
import { VALID_HACKATHONS } from "@/lib/constants";
import type { HackathonInfoItem, HackathonName } from "@/lib/types";
import { fetchHackathonInfo } from "@/services/latest-hackathons";
import { Outlet, createFileRoute, notFound, useRouterState } from "@tanstack/react-router";

// Combined context made available to descendants of /$activeHackathon
type HackathonRouteContext = {
  activeHackathon: HackathonName;
} & HackathonInfoItem;

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
   * Expose the validated `activeHackathon` to all descendants via route context
   */
  context: ({ params }) => {
    return {
      activeHackathon: params.activeHackathon,
    } satisfies Pick<HackathonRouteContext, "activeHackathon">;
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
   * Provide hackathon info via route context for descendants to use in components and loaders
   *
   * how context is built
   * - `context()` exposes activeHackathon (from params)
   * - `beforeLoad()` returns the current activeHackathon's info (dbCollectionName, display names, year)
   * - Tanstack Router merges both into the route context for all descendants
   *
   * to avoid redundant fetches, if the previous `beforeLoad` result's `dbCollectionName` starts with the current `activeHackathon` slug,
   * we reuse it, otherwise we fetch again
   *
   * @param params - route params containing activeHackathon
   * @param matches - route matches containing the previous `beforeLoad` result
   * @returns the current activeHackathon's info (dbCollectionName, display names, year)
   */
  beforeLoad: async ({ params, matches }) => {
    const activeHackathon = params.activeHackathon;

    const selfMatch = matches.find((m) => m.routeId === "/$activeHackathon");
    const prev = selfMatch?.__beforeLoadContext as HackathonInfoItem | undefined;

    if (prev?.dbCollectionName?.toLowerCase().startsWith(activeHackathon)) {
      return prev satisfies Omit<HackathonRouteContext, "activeHackathon">;
    }

    const data = await fetchHackathonInfo(activeHackathon);
    if (!data) throw notFound();
    return data satisfies Omit<HackathonRouteContext, "activeHackathon">;
  },
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
