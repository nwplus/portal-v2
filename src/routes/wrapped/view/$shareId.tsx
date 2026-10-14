import ShareNotFound from "@/components/errors/share-not-found";
import { archetypeCopy } from "@/lib/wrapped/archetype-copy";
import { fetchWrappedShareCard } from "@/services/wrapped";
import { createFileRoute, notFound } from "@tanstack/react-router";

/**
 * Public, unauthenticated view of a shared Wrapped card.
 *
 * Top-level on purpose — outside `_auth` and outside `/$activeHackathon`. A shared link
 * has to survive a logged-out viewer and a switched-off portal, and `$activeHackathon`'s
 * `beforeLoad` would redirect an unauthenticated visitor to `/application` whenever
 * `portalLive` is false, which is exactly the post-event state this page ships into.
 *
 * Renders `WrappedShareCard` only, never `WrappedDoc` — the card carries no uid, email
 * or teammate data, and that boundary is the whole reason it is a separate document.
 */
export const Route = createFileRoute("/wrapped/view/$shareId")({
  loader: async ({ params }) => {
    const card = await fetchWrappedShareCard(params.shareId);
    if (!card) throw notFound();
    return { card };
  },
  // Required, not decorative: the router's default 404 component reads hackathon route
  // context and would throw here rather than render.
  notFoundComponent: ShareNotFound,
  component: RouteComponent,
});

function RouteComponent() {
  const { card } = Route.useLoaderData();
  const { label, description } = archetypeCopy(card.archetype);
  const { projectTitle, mealCount, workshopCount, miniEventCount, stampCount, prizes } = card.stats;

  const stats = [
    { label: mealCount === 1 ? "meal" : "meals", value: mealCount },
    { label: workshopCount === 1 ? "workshop" : "workshops", value: workshopCount },
    { label: miniEventCount === 1 ? "activity" : "activities", value: miniEventCount },
    { label: stampCount === 1 ? "stamp" : "stamps", value: stampCount },
  ].filter((stat) => stat.value > 0);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div className="flex flex-col gap-2">
        <p className="font-medium text-sm text-text-secondary uppercase tracking-widest">
          {card.preferredName}&apos;s Hacker Wrapped
        </p>
        <h1 className="font-bold text-4xl text-text-primary md:text-6xl">{label}</h1>
        <p className="max-w-md text-text-secondary">{description}</p>
      </div>

      {projectTitle && (
        <p className="text-text-primary">
          Built <span className="font-semibold">{projectTitle}</span>
        </p>
      )}

      {stats.length > 0 && (
        <dl className="flex flex-wrap justify-center gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="font-bold text-3xl text-text-primary">{stat.value}</dd>
              <span className="text-sm text-text-secondary">{stat.label}</span>
            </div>
          ))}
        </dl>
      )}

      {prizes.length > 0 && (
        <ul className="flex max-w-xl flex-wrap justify-center gap-2">
          {prizes.map((prize) => (
            <li
              key={prize}
              className="rounded-full border border-border-subtle px-3 py-1 text-sm text-text-primary"
            >
              {prize}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
