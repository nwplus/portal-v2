import { Button } from "@/components/ui/button";
import { useHackathon } from "@/hooks/use-hackathon";
import { useApplicationQuestionStore } from "@/lib/stores/application-question-store";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/_auth/application/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { activeHackathon } = useHackathon();
  const welcome = useApplicationQuestionStore((s) => s.welcome);

  if (!welcome) {
    return <div>No welcome message yet.</div>;
  }

  return (
    <section className="space-y-6">
      <h1 className="font-semibold text-2xl">{welcome.title ?? "Welcome"}</h1>
      {welcome.content ? <p className="whitespace-pre-line">{welcome.content}</p> : null}
      {welcome.description ? <p className="text-sm">{welcome.description}</p> : null}

      <Button asChild>
        <Link to="/$activeHackathon/application/basic-info" params={{ activeHackathon }}>
          Get Started
        </Link>
      </Button>
    </section>
  );
}
