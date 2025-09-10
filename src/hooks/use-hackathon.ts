import { HACKATHON_CONFIG } from "@/lib/constants";
import type { HackathonConfigItem } from "@/lib/types";
import { Route as HackathonRoute } from "@/routes/$hackathon";
import { useLoaderData } from "@tanstack/react-router";

export function useHackathon() {
  return useLoaderData({ from: HackathonRoute.id });
}

export function useHackathonConfig(): HackathonConfigItem {
  const { activeHackathon } = useHackathon();
  return HACKATHON_CONFIG[activeHackathon];
}
