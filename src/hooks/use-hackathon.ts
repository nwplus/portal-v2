import { Route as ActiveHackathonRoute } from "@/routes/$activeHackathon";

/**
 * @returns validated activeHackathon from the URL
 */
export function useHackathon() {
  const { activeHackathon } = ActiveHackathonRoute.useRouteContext();
  return { activeHackathon };
}
