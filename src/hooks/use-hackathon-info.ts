import type { HackathonInfoItem } from "@/lib/types";
import { Route as ActiveHackathonRoute } from "@/routes/$activeHackathon";

/**
 * Returns the hackathon info from the route context, used for getting the following in client components:
 * - dbCollectionName (nwHacks2025)
 * - displayNameFull (nwHacks 2025)
 * - displayNameShort (nwHacks)
 * - hackathonYear (2025)
 *
 * @returns a HackathonInfoItem
 */
export function useHackathonInfo(): HackathonInfoItem {
  const { dbCollectionName, displayNameFull, displayNameShort, hackathonYear } =
    ActiveHackathonRoute.useRouteContext();

  return { dbCollectionName, displayNameFull, displayNameShort, hackathonYear };
}
