import { Navbar } from "@/components/features/application/navbar";
import { PolaroidStack } from "@/components/features/application/polaroid-stack";
import { ProgressBar } from "@/components/features/application/progress-bar";
import { useApplicantAutosave } from "@/hooks/use-applicant-autosave";
import { useHackathon } from "@/hooks/use-hackathon";
import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import { useIsMobile } from "@/hooks/use-mobile";
import { useApplicantStore } from "@/lib/stores/applicant-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Navigate, Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import type { WheelEvent } from "react";

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
  const isMobile = useIsMobile();

  const { activeHackathon } = useHackathon();
  const { dbCollectionName } = useHackathonInfo();
  const user = useAuthStore((s) => s.user);
  const saving = useApplicantAutosave(dbCollectionName, user?.uid);
  const applicantDraft = useApplicantStore((s) => s.applicantDraft);
  const hydratedDbCollectionName = useApplicantStore((s) => s.dbCollectionName);

  // Forwards wheel events from outside the scroll container to the form
  const handleWheel = (e: WheelEvent) => {
    const scrollContainer = document.querySelector("[data-scroll-container]");
    if (!scrollContainer) return;

    const target = e.target as HTMLElement;
    if (scrollContainer.contains(target)) return;

    let el: HTMLElement | null = target;
    while (el) {
      const { overflowY } = getComputedStyle(el);
      if (overflowY === "auto" || overflowY === "scroll") return;
      el = el.parentElement;
    }

    scrollContainer.scrollTop += e.deltaY;
  };

  // Block until the draft is hydrated for the CURRENT hackathon.
  // This prevents stale data from a previous hackathon triggering the redirect.
  const isHydrating = hydratedDbCollectionName !== dbCollectionName;

  if (!applicantDraft || isHydrating) {
    return null;
  }

  if (applicantDraft.status?.applicationStatus !== "inProgress") {
    return <Navigate to="/$activeHackathon/application" params={{ activeHackathon }} />;
  }

  return (
    <div className="flex h-full flex-col">
      <Navbar saving={saving} variant="application-step" />
      {isMobile && (
        <div className="px-6 pb-4">
          <ProgressBar step={step} orientation="horizontal" />
        </div>
      )}
      <div className="flex min-h-0 flex-1" onWheel={handleWheel}>
        <div className="flex flex-1 gap-[max(3rem,10%)] px-6 py-2">
          {!isMobile && <ProgressBar step={step} />}
          <div className="flex min-h-0 flex-1 flex-col justify-between gap-10 overflow-hidden">
            <Outlet />
          </div>
        </div>
        {!isMobile && (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <PolaroidStack step={step} className="max-h-[80%] w-[70%]" />
          </div>
        )}
      </div>
    </div>
  );
}
