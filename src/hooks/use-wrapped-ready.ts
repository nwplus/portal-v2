import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import { useWrappedStore } from "@/lib/stores/wrapped-store";
import { useEffect } from "react";

/**
 * Whether the active hackathon's Wrapped is released — `Hackathons/{event}.wrapped.isReady`
 * — for the sidebar link and banner. Honoured in every build, so what a developer sees
 * matches what hackers will.
 *
 * @returns false until the flag has loaded, so nothing flashes in before release
 */
export function useWrappedReady(): boolean {
  const { dbCollectionName } = useHackathonInfo();
  const isReady = useWrappedStore((state) => state.ready[dbCollectionName]);
  const getOrFetchReady = useWrappedStore((state) => state.getOrFetchReady);

  useEffect(() => {
    if (dbCollectionName) void getOrFetchReady(dbCollectionName);
  }, [dbCollectionName, getOrFetchReady]);

  return isReady === true;
}
