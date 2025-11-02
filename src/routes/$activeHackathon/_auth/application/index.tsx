import { useApplicationQuestionStore } from "@/lib/stores/application-question-store";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/_auth/application/")({
  component: RouteComponent,
});

function RouteComponent() {
  const welcome = useApplicationQuestionStore((s) => s.welcome);

  if (!welcome) {
    return <div>No welcome message yet.</div>;
  }

  return (
    <section className="space-y-6">
      <h1 className="font-semibold text-2xl">{welcome.title ?? "Welcome"}</h1>
      {welcome.content ? (
        <p className="whitespace-pre-line text-muted-foreground">{welcome.content}</p>
      ) : null}
      {welcome.description ? (
        <p className="text-muted-foreground text-sm">{welcome.description}</p>
      ) : null}
    </section>
  );
}
