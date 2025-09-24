import type { HackathonInfoItem } from "@/lib/types";
import { Route as ActiveHackathonRoute } from "@/routes/$activeHackathon";

export function useHackathonInfo(): HackathonInfoItem {
  const data = ActiveHackathonRoute.useLoaderData();
  if (!data) {
    throw new Error("Hackathon info not available");
  }
  return data as HackathonInfoItem;
}
