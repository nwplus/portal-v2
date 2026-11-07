import { WrappedDeck } from "@/components/features/wrapped/wrapped-deck";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useWrappedStore } from "@/lib/stores/wrapped-store";
import { getWrappedFixture } from "@/lib/wrapped/fixture";
import { consumeLaunchHandoff } from "@/lib/wrapped/launch-handoff";
import { type LiveStamp, buildStampSlots } from "@/lib/wrapped/stamp-slots";
import { fetchWrappedOptIn } from "@/services/socials";
import { fetchEventStamps, fetchWrappedDoc } from "@/services/wrapped";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/_auth/(account)/wrapped")({
  // The deck is full-bleed, like login and the application flow.
  staticData: { hideSidebar: true },
  // Return type keeps `mock` optional rather than `string | undefined`, so `<Link>`s to
  // this route are not forced to pass a `search` prop just to satisfy the validator.
  validateSearch: (search): { mock?: string } => ({
    /** Dev-only fixture selector; ignored in production builds. See `lib/wrapped/fixture.ts`. */
    mock: search.mock as string | undefined,
  }),
  loaderDeps: ({ search }) => ({ mock: search.mock }),
  /**
   * Gates on the organizer release flag, `Hackathons/{event}.wrapped.isReady`.
   *
   * Admins bypass it so organizers can preview a deck before release, matching the
   * `isAdmin` escape hatches in `$activeHackathon.tsx` and the application step layout.
   * Dev builds also open for `?mock=` fixtures, which need no release.
   *
   * NOTE: this route also inherits `$activeHackathon`'s guard, so reaching it needs
   * `portalLive[hackathon]` to still be true as well.
   */
  beforeLoad: async ({ context, search }) => {
    if (useAuthStore.getState().isAdmin) return;
    if (getWrappedFixture(search.mock)) return;

    const isReady = context.dbCollectionName
      ? await useWrappedStore.getState().getOrFetchReady(context.dbCollectionName)
      : false;
    if (!isReady) throw notFound();
  },
  loader: async ({ context, deps }) => {
    // Set by the banner's animated launch; false when the deck was opened directly.
    const launchedFromBanner = consumeLaunchHandoff();
    const fixture = getWrappedFixture(deps.mock);
    if (fixture) {
      // Telemetry is suppressed for fixtures — a developer flipping through mock decks
      // must not land in the organizer open-rate numbers.
      const stampSlots = buildStampSlots(
        fixture.showedUp.stamps,
        await fetchEventStampsOrNull(fixture.eventId),
      );
      return {
        wrapped: fixture,
        stampSlots,
        dbCollectionName: null,
        uid: null,
        launchedFromBanner,
      };
    }

    const { dbCollectionName } = context;
    const { user } = useAuthStore.getState();

    if (!user?.uid || !dbCollectionName) throw notFound();

    // Opt-out is checked here as well as in the batch script, because the two can
    // disagree: a hacker who opts out after a run still has a deck sitting in
    // Firestore until the next one. The read runs alongside the deck fetch rather
    // than before it — an opted-in hacker, which is nearly all of them, pays no
    // extra latency for the check.
    const [wrapped, isOptedIn, liveStamps] = await Promise.all([
      fetchWrappedDoc(dbCollectionName, user.uid),
      fetchWrappedOptIn(user.uid),
      fetchEventStampsOrNull(dbCollectionName),
    ]);
    if (!wrapped || !isOptedIn) throw notFound();

    const stampSlots = buildStampSlots(wrapped.showedUp.stamps, liveStamps);
    return { wrapped, stampSlots, dbCollectionName, uid: user.uid, launchedFromBanner };
  },
  component: RouteComponent,
});

/**
 * The event's stamps for the stamps slide, or null if they can't be read. A failed read
 * is no reason to withhold the deck: the slide falls back to the collected stamps on it.
 */
async function fetchEventStampsOrNull(eventId: string): Promise<LiveStamp[] | null> {
  try {
    return await fetchEventStamps(eventId);
  } catch (error) {
    console.error("Failed to read the event's stamps for Wrapped", error);
    return null;
  }
}

function RouteComponent() {
  const { wrapped, stampSlots, dbCollectionName, uid, launchedFromBanner } = Route.useLoaderData();
  const { activeHackathon } = Route.useParams();
  const navigate = useNavigate();

  return (
    <WrappedDeck
      doc={wrapped}
      stampSlots={stampSlots}
      dbCollectionName={dbCollectionName}
      uid={uid}
      launchedFromBanner={launchedFromBanner}
      onClose={() => navigate({ to: "/$activeHackathon", params: { activeHackathon } })}
    />
  );
}
