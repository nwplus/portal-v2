import { ProgressBar } from "@/components/features/application/progress-bar";
import { Outlet, createFileRoute, useLocation } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/_auth/application/_step-layout")({
  component: RouteComponent,
});

const STEP_MAP: Record<string, 1 | 2 | 3 | 4> = {
  "basic-info": 1,
  skills: 2,
  questionnaire: 3,
  review: 4,
};

function RouteComponent() {
  const location = useLocation();
  const lastSegment = location.pathname.split("/").pop() ?? "";
  const step = STEP_MAP[lastSegment] ?? 1;

  return (
    <div className="flex h-full">
      <div className="flex flex-1 gap-16 px-6 py-2">
        <ProgressBar step={step} />
        <div className="flex min-h-0 flex-1 flex-col justify-between gap-6 overflow-hidden">
          <Outlet />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center">right side</div>
    </div>
  );
}
