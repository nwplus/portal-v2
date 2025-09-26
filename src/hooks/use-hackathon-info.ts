import type { HackathonInfoItem } from "@/lib/types";
import { Route as ActiveHackathonRoute } from "@/routes/$activeHackathon";

export function useHackathonInfo(): HackathonInfoItem {
  return ActiveHackathonRoute.useLoaderData();
}
