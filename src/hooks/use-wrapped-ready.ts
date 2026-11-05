import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import { useAuthStore } from "@/lib/stores/auth-store";
import { accessKey, useWrappedStore } from "@/lib/stores/wrapped-store";
import { useEffect } from "react";

/**
 * Whether the active hackathon's Wrapped is released — `Hackathons/{event}.wrapped.isReady`.
 * Honoured in every build, so what a developer sees matches what hackers will. Stays live
 * while mounted, so a tab left open before release picks up the switch turning on.
 *
 * @returns false until the flag has loaded, so nothing flashes in before release
 */
function useWrappedReady(): boolean {
  const { dbCollectionName } = useHackathonInfo();
  const isReady = useWrappedStore((state) => state.ready[dbCollectionName]);
  const watchReady = useWrappedStore((state) => state.watchReady);

  useEffect(
    () => (dbCollectionName ? watchReady(dbCollectionName) : undefined),
    [dbCollectionName, watchReady],
  );

  return isReady === true;
}

/**
 * Whether the signed-in hacker can open their Wrapped: it's released, they have a deck,
 * and they haven't opted out. Gates the sidebar link and the banner, so neither points a
 * hacker at a deck that would 404. The deck isn't read until the event is released.
 *
 * @returns false until both checks have loaded
 */
export function useWrappedAvailable(): boolean {
  const { dbCollectionName } = useHackathonInfo();
  const uid = useAuthStore((state) => state.user?.uid);
  const isReady = useWrappedReady();
  const hasAccess = useWrappedStore((state) =>
    uid ? state.access[accessKey(dbCollectionName, uid)] : undefined,
  );
  const getOrFetchAccess = useWrappedStore((state) => state.getOrFetchAccess);

  // Re-runs when `hasAccess` is cleared (a profile save), so the link comes back. A failed
  // read stores nothing, so it can't loop; the next mount or clear retries.
  useEffect(() => {
    if (isReady && uid && dbCollectionName && hasAccess === undefined) {
      void getOrFetchAccess(dbCollectionName, uid);
    }
  }, [isReady, uid, dbCollectionName, hasAccess, getOrFetchAccess]);

  return isReady && hasAccess === true;
}
