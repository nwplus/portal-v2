import { GradientBackground } from "@/components/layout/gradient-background";
import { useApplicantHydration } from "@/hooks/use-applicant-hydration";
import { useApplicationQuestions } from "@/hooks/use-application-questions";
import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { createContext, useEffect, useMemo, useRef } from "react";
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
  const applicantDraft = useApplicantStore((s) => s.applicantDraft);
  const user = useAuthStore((s) => s.user);
  const { applicant } = Route.useLoaderData();
  const applicationQuestions = useApplicationQuestionStore();

  // Use resolvedLocation so gradient position only changes after child routes finish loading
  const resolvedPathname = useRouterState({
    select: (state) => state.resolvedLocation?.pathname ?? state.location.pathname,
  });
  const isRsvpPage = resolvedPathname.endsWith("/rsvp");
  const isIndexPage = resolvedPathname.endsWith("/application");
  const isMobile = useIsMobile();
  const gradientPosition: BackgroundGradientPosition = isMobile
    ? "bottomMiddle"
    : isIndexPage
      ? "bottomMiddle"
      : isRsvpPage
        ? "topMiddle"
        : "bottomRight";

  useApplicationQuestions(displayNameShort);
  useApplicantHydration({
    dbCollectionName,
    applicant,
    user,
  });

  const { schema, meta } = useMemo(
    () =>
      buildApplicationSchema({
        BasicInfo: applicationQuestions.basicInfoQuestions,
        Skills: applicationQuestions.skillsQuestions,
        Questionnaire: applicationQuestions.questionnaireQuestions,
        // Welcome: applicationQuestions.welcome ? [applicationQuestions.welcome] : [],
      }),
    [
      applicationQuestions.basicInfoQuestions,
      applicationQuestions.questionnaireQuestions,
      applicationQuestions.skillsQuestions,
      // applicationQuestions.welcome,
    ],
  );

  const formMethods = useForm<ApplicationFormValues>({
    // zodResolver typings in RHF v7 expect Zod schema on FieldValues; cast for our concrete shape.
    // biome-ignore lint/suspicious/noExplicitAny: resolver's generics do not align cleanly with our schema type, but runtime shapes match ApplicationFormValues
    resolver: zodResolver(schema as any) as Resolver<ApplicationFormValues>,
    mode: "onBlur",
    // Re-validate fields on change once they've been blurred/submitted so
    // errors (including Select All required errors) clear as soon as users
    // fix their input.
    reValidateMode: "onChange",
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

  return (
    <div className="h-svh w-full bg-bg-pane-container p-0 md:p-4">
      <GradientBackground
        gradientPosition={gradientPosition}
        className="scrollbar-hidden relative flex h-full w-full flex-col overflow-hidden rounded-none p-4 pb-0 shadow-none md:rounded-xl md:pb-4 md:shadow-sm"
      >
        <ApplicationSchemaMetaContext.Provider value={meta}>
          <FormProvider {...formMethods}>
            <div className="min-h-0 flex-1">
              <Outlet />
            </div>
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
