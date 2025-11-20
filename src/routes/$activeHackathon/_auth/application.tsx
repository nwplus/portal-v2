import { GradientBackground } from "@/components/layout/gradient-background";
import { useApplicantAutosave } from "@/hooks/use-applicant-autosave";
import { useApplicantHydration } from "@/hooks/use-applicant-hydration";
import { useApplicationQuestions } from "@/hooks/use-application-questions";
import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import { useSyncFormWithApplicantDraft } from "@/hooks/use-sync-form-with-applicant-draft";
import type { SchemaMeta } from "@/lib/application/form-schema";
import { buildApplicationSchema } from "@/lib/application/form-schema";
import type { ApplicationFormValues } from "@/lib/application/types";
import type { BackgroundGradientPosition } from "@/lib/firebase/types";
import type { ApplicantDraft } from "@/lib/firebase/types/applicants";
import { useApplicantStore } from "@/lib/stores/applicant-store";
import { useApplicationQuestionStore } from "@/lib/stores/application-question-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { fetchApplicant } from "@/services/applicants";
import { zodResolver } from "@hookform/resolvers/zod";
import { Outlet, createFileRoute, useMatches } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import type { Resolver } from "react-hook-form";
import { FormProvider, useForm } from "react-hook-form";

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
  const matches = useMatches();
  const applicationQuestions = useApplicationQuestionStore();

  // the gradient position is different for the rsvp page
  const isRsvpPage = matches.some((match) => match.routeId.endsWith("/rsvp"));
  const gradientPosition: BackgroundGradientPosition = isRsvpPage ? "topMiddle" : "bottomRight";

  useApplicationQuestions(displayNameShort);
  useApplicantHydration({
    dbCollectionName,
    applicant,
    user,
  });

  const saving = useApplicantAutosave(dbCollectionName, user?.uid);

  const { schema, meta } = useMemo(
    () =>
      buildApplicationSchema({
        BasicInfo: applicationQuestions.basicInfoQuestions,
        Skills: applicationQuestions.skillsQuestions,
        Questionnaire: applicationQuestions.questionnaireQuestions,
        Welcome: applicationQuestions.welcome ? [applicationQuestions.welcome] : [],
      }),
    [
      applicationQuestions.basicInfoQuestions,
      applicationQuestions.questionnaireQuestions,
      applicationQuestions.skillsQuestions,
      applicationQuestions.welcome,
    ],
  );

  const formMethods = useForm<ApplicationFormValues>({
    // zodResolver typings in RHF v7 expect Zod schema on FieldValues; cast for our concrete shape.
    // biome-ignore lint/suspicious/noExplicitAny: resolver's generics do not align cleanly with our schema type, but runtime shapes match ApplicationFormValues
    resolver: zodResolver(schema as any) as Resolver<ApplicationFormValues>,
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: deriveDefaultValuesFromApplicantDraft(applicantDraft),
  });

  // Keep form values in sync when a draft first hydrates.
  // We intentionally avoid resetting on every applicantDraft change to prevent
  // feedback loops between form -> store -> form.
  const previousApplicantDraftRef = useRef<ApplicantDraft | null>(null);
  useEffect(() => {
    const previousApplicantDraft = previousApplicantDraftRef.current;
    previousApplicantDraftRef.current = applicantDraft ?? null;

    // Only reset when transitioning from no draft to an initial hydrated draft.
    if (!previousApplicantDraft && applicantDraft) {
      formMethods.reset(deriveDefaultValuesFromApplicantDraft(applicantDraft));
    }
  }, [applicantDraft, formMethods]);

  // Mirror form values into the applicant store so autosave continues to work.
  useSyncFormWithApplicantDraft(formMethods);

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

    return <span className="text-text-secondary text-xs">{statusText}</span>;
  }, [applicantDraft, dirty, saving]);

  return (
    <div className="h-svh w-full bg-bg-pane-container p-4">
      <GradientBackground
        gradientPosition={gradientPosition}
        className="h-full w-full overflow-y-auto overflow-x-hidden rounded-xl p-4 shadow-sm"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="font-medium text-sm">Application</div>
          {saveIndicator}
        </div>
        <ApplicationSchemaMetaContext.Provider value={meta}>
          <FormProvider {...formMethods}>
            <Outlet />
          </FormProvider>
        </ApplicationSchemaMetaContext.Provider>
      </GradientBackground>
    </div>
  );
}

/**
 * Derives react-hook-form default values from the applicant draft.
 * Keeps defaults aligned with the persisted draft shape.
 */
function deriveDefaultValuesFromApplicantDraft(
  applicantDraft: ApplicantDraft | null,
): ApplicationFormValues {
  return {
    basicInfo: applicantDraft?.basicInfo ?? {},
    skills: applicantDraft?.skills ?? {},
    questionnaire: applicantDraft?.questionnaire ?? {},
    termsAndConditions: applicantDraft?.termsAndConditions ?? {},
  };
}

const ApplicationSchemaMetaContext = createContext<SchemaMeta | null>(null);

export function useApplicationSchemaMeta() {
  return useContext(ApplicationSchemaMetaContext);
}
