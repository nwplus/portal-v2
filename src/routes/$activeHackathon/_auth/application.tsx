import { useApplicationQuestions } from "@/hooks/use-application-questions";
import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/_auth/application")({
  staticData: { hideSidebar: true },
  component: () => <RouteComponent />,
});

function RouteComponent() {
  const { displayNameShort } = useHackathonInfo();

  useApplicationQuestions(displayNameShort);

  // TODO: hydrate applicant store once, start autosave loop
  return (
    <div className="h-svh w-full bg-sidebar p-4">
      <main className="h-full w-full overflow-y-auto overflow-x-hidden rounded-xl bg-background p-4 shadow-sm">
        <Outlet />
      </main>
    </div>
  );
}
