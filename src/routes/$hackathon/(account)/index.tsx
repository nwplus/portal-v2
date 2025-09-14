import { useHackathon, useHackathonConfig } from "@/hooks/use-hackathon";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$hackathon/(account)/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { activeHackathon } = useHackathon();
  const { dbCollectionName, displayNameFull, displayNameShort } = useHackathonConfig();
  return (
    <div>
      <p>Active hackathon: {activeHackathon}</p>
      <p>DB collection name: {dbCollectionName}</p>
      <p>Display name full: {displayNameFull}</p>
      <p>Display name short: {displayNameShort}</p>
    </div>
  );
}
