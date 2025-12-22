import { RsvpCheckbox } from "@/components/features/application/rsvp-checkbox";
import { Button } from "@/components/ui/button";
import { ScrollFade } from "@/components/ui/scroll-fade";
import { useHackathon } from "@/hooks/use-hackathon";
import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import { type RsvpFormValues, rsvpSchema } from "@/lib/application/rsvp-schema";
import { useApplicantStore } from "@/lib/stores/applicant-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { usePortalStore } from "@/lib/stores/portal-store";
import { fireSideCannons, getHackathonIcon } from "@/lib/utils";
import { confirmRsvp } from "@/services/applicants";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate, createFileRoute, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { FormProvider, type Resolver, useForm } from "react-hook-form";

function RsvpSection({
  heading,
  description,
  children,
}: {
  heading?: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      {(heading || description) && (
        <div>
          {heading && <h2 className="font-medium text-2xl">{heading}</h2>}
          {description && <p className="mt-1 text-sm text-text-primary">{description}</p>}
        </div>
      )}
      <div className="flex flex-col gap-8">{children}</div>
    </div>
  );
}

export const Route = createFileRoute("/$activeHackathon/_auth/application/rsvp")({
  component: RouteComponent,
});

function RouteComponent() {
  const { activeHackathon } = useHackathon();
  const { dbCollectionName, displayNameFull, displayNameShort } = useHackathonInfo();
  const router = useRouter();

  const applicantDraft = useApplicantStore((s) => s.applicantDraft);
  const user = useAuthStore((s) => s.user);
  const hackathonWeekend = usePortalStore((s) => s.hackathonWeekend?.[activeHackathon]);
  const waiversAndForms = usePortalStore((s) => s.waiversAndForms?.[activeHackathon]);
  const rsvpBy = usePortalStore((s) => s.rsvpBy?.[activeHackathon]);
  const rsvpOpen = usePortalStore((s) => s.rsvpOpen?.[activeHackathon]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const LogoIcon = getHackathonIcon(activeHackathon);
  const showSafewalk = activeHackathon === "nwhacks" || activeHackathon === "cmd-f";

  const formMethods = useForm<RsvpFormValues>({
    // biome-ignore lint/suspicious/noExplicitAny: resolver's generics do not align cleanly with our schema type
    resolver: zodResolver(rsvpSchema as any) as Resolver<RsvpFormValues>,
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      willBeAttendingCheck: applicantDraft?.basicInfo?.willBeAttendingCheck ?? false,
      releaseLiabilityCheck: applicantDraft?.basicInfo?.releaseLiabilityCheck ?? false,
      mediaConsentCheck: applicantDraft?.basicInfo?.mediaConsentCheck ?? false,
      safewalkCheck: applicantDraft?.basicInfo?.safewalkCheck ?? false,
      sponsorEmailConsentCheck: applicantDraft?.basicInfo?.sponsorEmailConsentCheck ?? false,
      marketingFeatureCheck: applicantDraft?.basicInfo?.marketingFeatureCheck ?? false,
    },
  });

  if (!applicantDraft) {
    return null;
  }

  const applicationStatus = applicantDraft.status?.applicationStatus;
  if (applicationStatus !== "acceptedNoResponseYet") {
    return <Navigate to="/$activeHackathon/application" params={{ activeHackathon }} />;
  }

  const handleConfirmRsvp = async () => {
    if (!rsvpOpen) {
      setSubmitError(
        `The RSVP deadline has passed. We appreciate your enthusiasm and hope to see you next time! Please reach out to ${activeHackathon}@nwplus.io if you have any questions.`,
      );
      return;
    }

    const isValid = await formMethods.trigger();
    if (!isValid) {
      const firstInvalid = document.querySelector('[aria-invalid="true"]');
      const fieldContainer = firstInvalid?.closest('[data-slot="field"]');
      (fieldContainer ?? firstInvalid)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const uid = user?.uid;
    if (!uid) {
      setSubmitError("Unable to submit. Please refresh and try again.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const formValues = formMethods.getValues();
      await confirmRsvp(dbCollectionName, uid, formValues);

      fireSideCannons(activeHackathon);

      await router.navigate({
        to: "/$activeHackathon/application",
        params: { activeHackathon },
      });
    } catch (error) {
      console.error("Failed to confirm RSVP", error);
      setSubmitError("Failed to confirm RSVP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-8">
      <nav className="hidden w-full items-center justify-between p-4 md:flex">
        <Link
          to="/$activeHackathon/application"
          params={{ activeHackathon }}
          className="text-sm text-text-secondary transition-colors hover:text-text-secondary/80"
        >
          &lt; Back to dashboard
        </Link>
        <div className="size-6">
          <LogoIcon />
        </div>
        <div className="w-[120px]" />
      </nav>

      <FormProvider {...formMethods}>
        <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-col gap-8 px-6 pb-4 md:pb-0">
          <ScrollFade className="flex min-h-0 flex-col gap-12">
            <div className="pt-8 text-center md:pt-0">
              <h1 className="font-medium text-xl md:text-3xl">RSVP Form</h1>
              <p className="mt-2 font-light text-base">
                Please read the following and submit to secure your spot
                {rsvpBy && ` by ${rsvpBy}`}.
              </p>
            </div>

            <div className="flex flex-col gap-12">
              <RsvpSection>
                <RsvpCheckbox
                  name="willBeAttendingCheck"
                  label={`Will you be attending ${displayNameFull} on the weekend of ${hackathonWeekend}?`}
                  checkboxLabel="Yes, I will be attending"
                  required
                />
              </RsvpSection>

              <RsvpSection
                heading="Waivers"
                description={
                  <>
                    Please read the waivers carefully. Checking a box is equivalent to signing the
                    waiver. If you will be under 19 years old on{" "}
                    {hackathonWeekend?.split("-")[0] ?? "by the hackathon weekend"}, you will need
                    to bring printed copies of these waivers signed by a parent or legal guardian
                    when you check in.
                  </>
                }
              >
                <RsvpCheckbox
                  name="releaseLiabilityCheck"
                  label="Release of Liability"
                  checkboxLabel="I have read the Release of Liability Waiver and agree to its terms"
                  description={
                    <>
                      This waives your right to hold nwPlus responsible for any injuries, damages,
                      or losses incurred from {displayNameShort}.{" "}
                      {waiversAndForms?.releaseLiability && (
                        <a
                          href={waiversAndForms.releaseLiability}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Read Full Waiver.
                        </a>
                      )}
                    </>
                  }
                  required
                />
                <RsvpCheckbox
                  name="mediaConsentCheck"
                  label="Media Consent"
                  checkboxLabel="I have read the Media Consent Waiver and agree to its terms"
                  description={
                    <>
                      This waiver allows nwPlus to use any photos or videos taken during the event
                      for promotional purposes.{" "}
                      {waiversAndForms?.media && (
                        <a href={waiversAndForms.media} target="_blank" rel="noopener noreferrer">
                          Read Full Waiver.
                        </a>
                      )}
                    </>
                  }
                />
              </RsvpSection>

              <RsvpSection heading="Other Information">
                {showSafewalk && (
                  <RsvpCheckbox
                    name="safewalkCheck"
                    label="Safewalk"
                    checkboxLabel="Yes, I would like to request this service"
                    description={`While ${displayNameShort} is a 24 hour hackathon, you are not required to sleep there. If you live close by, we recommend that you sleep at home on the night of ${hackathonWeekend?.split("-")[0]}. For safety, we are offering a service where nwPlus organizers or volunteers walk hackers anywhere on campus.`}
                  />
                )}
                <RsvpCheckbox
                  name="sponsorEmailConsentCheck"
                  label="Sponsor Email Consent"
                  checkboxLabel={`I authorize the use of my email to receive emails from ${displayNameShort} sponsors`}
                  description={`Would you like to receive hiring opportunities, promotions, and information from participating ${displayNameShort} sponsors?`}
                />
                <RsvpCheckbox
                  name="marketingFeatureCheck"
                  label={`${displayNameFull} Feature Opportunity`}
                  checkboxLabel="Yes, I am interested in participating in feature videos"
                  description={`We are looking for people to be featured in interview videos about their experience at ${displayNameShort}. Filming will take ~10 mins and will take place during the hackathon. If chosen, our team will reach out with further instructions.`}
                />
              </RsvpSection>
            </div>
          </ScrollFade>

          {submitError && <p className="text-center text-sm text-text-error">{submitError}</p>}

          <div className="flex justify-center md:justify-end">
            <Button variant="primary" onClick={handleConfirmRsvp} disabled={submitting}>
              {submitting ? "Confirming..." : "Confirm RSVP"}
            </Button>
          </div>
        </div>
      </FormProvider>
    </div>
  );
}
