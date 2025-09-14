import { VALID_HACKATHONS } from "@/lib/constants";
import { Outlet, createFileRoute, notFound } from "@tanstack/react-router";

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
  component: () => <Outlet />,
});
