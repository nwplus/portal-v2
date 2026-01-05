import { GradientBackground } from "@/components/layout/gradient-background";
import { MyProfile } from "@/components/social-profile/my-profile";
import { RecentlyViewed } from "@/components/social-profile/recently-viewed";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  useEffect(() => {
    if (!user?.uid || !user?.email || !dbCollectionName) return;

    const uid = user.uid;
    const email = user.email;

    const loadData = async () => {
      try {
        setIsLoading(true);

        const loadedApplicant = applicant ? null : await fetchApplicant(dbCollectionName, uid);

        if (loadedApplicant && !applicant) {
          setApplicant(
            {
              ...loadedApplicant,
              submission: {
                submitted: loadedApplicant.submission?.submitted ?? false,
                ...(loadedApplicant.submission ?? {}),
              },
            },
            dbCollectionName,
          );
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
      <GradientBackground
        gradientPosition="bottomMiddle"
        className="max-h-screen overflow-y-scroll"
      >
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <Spinner className="size-8 text-white" />
        </div>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground
      gradientPosition="bottomMiddle"
      className="scrollbar-hidden max-h-screen overflow-y-auto"
    >
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
        <div className="w-full max-w-3xl">
          <Tabs defaultValue="profile" className="w-full">
            <div className="mb-6 flex justify-center">
              <TabsList className="h-auto gap-1 rounded-lg border border-border-subtle bg-bg-pane-container p-1">
                <TabsTrigger
                  value="profile"
                  className="h-auto rounded-md px-4 py-1.5 font-medium text-sm text-text-secondary transition-all duration-200 hover:text-text-primary data-[state=active]:bg-bg-button-secondary data-[state=active]:text-text-primary data-[state=active]:shadow-none"
                >
                  My profile
                </TabsTrigger>
                <TabsTrigger
                  value="recently-viewed"
                  className="h-auto rounded-md px-4 py-1.5 font-medium text-sm text-text-secondary transition-all duration-200 hover:text-text-primary data-[state=active]:bg-bg-button-secondary data-[state=active]:text-text-primary data-[state=active]:shadow-none"
                >
                  Recently viewed
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="profile">
              {user?.uid && user?.email && (
                <MyProfile
                  socialProfile={socialProfile}
                  onProfileUpdate={setSocialProfile}
                  uid={user.uid}
                  email={user.email}
                  displayName={displayName}
                />
              )}
            </TabsContent>

            <TabsContent value="recently-viewed">
              <RecentlyViewed socialProfile={socialProfile} onProfileUpdate={setSocialProfile} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </GradientBackground>
  );
}
