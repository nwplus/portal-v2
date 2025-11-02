import { useApplicantAutosave } from "@/hooks/use-applicant-autosave";
import { useApplicantHydration } from "@/hooks/use-applicant-hydration";
import { useApplicationQuestions } from "@/hooks/use-application-questions";
import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import { useApplicantStore } from "@/lib/stores/applicant-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { fetchApplicant } from "@/services/applicants";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

export const Route = createFileRoute("/$activeHackathon/_auth/application")({
  staticData: { hideSidebar: true },
  loader: async ({ context }) => {
    const { dbCollectionName } = context;
    const { user } = useAuthStore.getState();

    if (!user?.uid || !dbCollectionName) {
      return { applicant: null };
    }

    const applicant = await fetchApplicant(dbCollectionName, user.uid);
    return { applicant };
  },
  component: () => <RouteComponent />,
});

function RouteComponent() {
  const { dbCollectionName, displayNameShort } = useHackathonInfo();
  const dirty = useApplicantStore((s) => s.dirty);
  const applicantDraft = useApplicantStore((s) => s.applicantDraft);
  const user = useAuthStore((s) => s.user);
  const { applicant } = Route.useLoaderData();

  useApplicationQuestions(displayNameShort);
  useApplicantHydration({
    dbCollectionName,
    applicant,
    user,
  });

  const saving = useApplicantAutosave(dbCollectionName, user?.uid);

  // TODO: style
  const saveIndicator = useMemo(() => {
    if (!applicantDraft) return null;

    let statusText = "Saved";

    if (applicantDraft.submission?.submitted) {
      statusText = "Submitted";
    } else if (saving) {
      statusText = "Saving…";
    } else if (dirty) {
      statusText = "Unsaved changes";
    }

    return <span className="text-muted-foreground text-xs">{statusText}</span>;
  }, [applicantDraft, dirty, saving]);

  return (
    <div className="h-svh w-full bg-sidebar p-4">
      <main className="h-full w-full overflow-y-auto overflow-x-hidden rounded-xl bg-background p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-medium text-sm">Application</div>
          {saveIndicator}
        </div>

        <Outlet />
      </main>
    </div>
  );
}
