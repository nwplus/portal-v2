import { GradientBackground } from "@/components/layout/gradient-background";
import { MyProfile } from "@/components/social-profile/my-profile";
import { RecentlyViewed } from "@/components/social-profile/recently-viewed";
import { Spinner } from "@/components/ui/spinner";
import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import type { Applicant } from "@/lib/firebase/types/applicants";
import type { Social } from "@/lib/firebase/types/socials";
import { useApplicantStore } from "@/lib/stores/applicant-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { fetchApplicant } from "@/services/applicants";
import { fetchOrCreateSocial } from "@/services/socials";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/$activeHackathon/_auth/(account)/social-profile")({
  component: RouteComponent,
});

function RouteComponent() {
  const user = useAuthStore((state) => state.user);
  const applicant = useApplicantStore((state) => state.applicantDraft);
  const setApplicant = useApplicantStore((state) => state.setApplicant);
  const { dbCollectionName } = useHackathonInfo();

  const [socialProfile, setSocialProfile] = useState<Social | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "recently-viewed">("profile");

  useEffect(() => {
    if (!user?.uid || !user?.email || !dbCollectionName) return;

    const uid = user.uid;
    const email = user.email;

    const loadData = async () => {
      try {
        setIsLoading(true);

        const loadedApplicant = applicant ? null : await fetchApplicant(dbCollectionName, uid);

        if (loadedApplicant && !applicant) {
          setApplicant({
            ...loadedApplicant,
            submission: {
              submitted: loadedApplicant.submission?.submitted ?? false,
              ...(loadedApplicant.submission ?? {}),
            },
          });
        }

        const applicantForSocial = loadedApplicant || (applicant as Applicant | null);
        const loadedSocial = await fetchOrCreateSocial(uid, email, applicantForSocial);
        setSocialProfile(loadedSocial);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.uid, user?.email, dbCollectionName, applicant, setApplicant]);

  const displayName = socialProfile?.preferredName || user?.displayName || "Unknown User";

  if (isLoading) {
    return (
      <GradientBackground gradientPosition="bottomMiddle">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <Spinner className="size-8 text-white" />
        </div>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground gradientPosition="bottomMiddle">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
        <div className="w-full max-w-3xl">
          <div className="mb-6 flex justify-center">
            <div className="inline-flex gap-1 rounded-lg border border-border-subtle bg-bg-pane-container p-1">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`rounded-md px-4 py-1.5 font-medium text-sm transition-colors ${
                  activeTab === "profile"
                    ? "bg-bg-button-secondary text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                My profile
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("recently-viewed")}
                className={`rounded-md px-4 py-1.5 font-medium text-sm transition-colors ${
                  activeTab === "recently-viewed"
                    ? "bg-bg-button-secondary text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Recently viewed
              </button>
            </div>
          </div>

          {activeTab === "profile" && user?.uid && user?.email && (
            <MyProfile
              socialProfile={socialProfile}
              onProfileUpdate={setSocialProfile}
              uid={user.uid}
              email={user.email}
              displayName={displayName}
            />
          )}

          {activeTab === "recently-viewed" && <RecentlyViewed />}
        </div>
      </div>
    </GradientBackground>
  );
}
