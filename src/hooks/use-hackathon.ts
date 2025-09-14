import { HACKATHON_CONFIG } from "@/lib/constants";
import type { HackathonConfigItem } from "@/lib/types";
import { Route as ActiveHackathonRoute } from "@/routes/$activeHackathon";

export function useHackathon() {
  return {
    activeHackathon: ActiveHackathonRoute.useParams().activeHackathon,
  };
}

export function useHackathonConfig(): HackathonConfigItem {
  const { activeHackathon } = useHackathon();
  return HACKATHON_CONFIG[activeHackathon];
}
