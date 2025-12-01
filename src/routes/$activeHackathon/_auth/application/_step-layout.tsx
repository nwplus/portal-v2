import { Navbar } from "@/components/features/application/navbar";
import { PolaroidStack } from "@/components/features/application/polaroid-stack";
import { ProgressBar } from "@/components/features/application/progress-bar";
import { useApplicantAutosave } from "@/hooks/use-applicant-autosave";
import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import { useApplicantStore } from "@/lib/stores/applicant-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Outlet, createFileRoute, redirect, useLocation } from "@tanstack/react-router";
import type { WheelEvent } from "react";

export const Route = createFileRoute("/$activeHackathon/_auth/application/_step-layout")({
  beforeLoad: async ({ params }) => {
    const { applicantDraft } = useApplicantStore.getState();

    if (
      applicantDraft?.submission?.submitted ||
      applicantDraft?.status?.applicationStatus !== "inProgress"
    ) {
      throw redirect({
        to: "/$activeHackathon/application",
        params: { activeHackathon: params.activeHackathon },
      });
    }
  },
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

  const { dbCollectionName } = useHackathonInfo();
  const user = useAuthStore((s) => s.user);
  const saving = useApplicantAutosave(dbCollectionName, user?.uid);

  // Forwards wheel events from outside the scroll container to the form
  const handleWheel = (e: WheelEvent) => {
    const scrollContainer = document.querySelector("[data-scroll-container]");
    if (!scrollContainer) return;

    const target = e.target as Node;
    if (!scrollContainer.contains(target)) {
      scrollContainer.scrollTop += e.deltaY;
    }
  };

  return (
    <div className="flex h-full flex-col">
      <Navbar saving={saving} variant="application-step" />
      <div className="flex min-h-0 flex-1" onWheel={handleWheel}>
        <div className="flex flex-1 gap-[max(3rem,10%)] px-6 py-2">
          <ProgressBar step={step} />
          <div className="flex min-h-0 flex-1 flex-col justify-between gap-10 overflow-hidden">
            <Outlet />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <PolaroidStack step={step} className="w-[70%]" />
        </div>
      </div>
    </div>
  );
}
