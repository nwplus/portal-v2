import { GradientBackground } from "@/components/layout/gradient-background";
import { MyProfile } from "@/components/social-profile/my-profile";
import { RecentlyViewed } from "@/components/social-profile/recently-viewed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Social } from "@/lib/firebase/types/socials";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useHackerStore } from "@/lib/stores/hacker-store";
import { fetchOrCreateSocial } from "@/services/socials";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/$activeHackathon/_auth/(account)/social-profile")({
  loader: async ({ context }) => {
    const { dbCollectionName } = context;
    const { user } = useAuthStore.getState();
    const getOrFetchHacker = useHackerStore.getState().getOrFetch;

    if (!user?.uid || !user?.email || !dbCollectionName) {
      return { socialProfile: null };
    }

    const hacker = await getOrFetchHacker(dbCollectionName, user.uid);
    const socialProfile = await fetchOrCreateSocial(user.uid, user.email, hacker);

    return { socialProfile };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const user = useAuthStore((state) => state.user);
  const { socialProfile: loaderProfile } = Route.useLoaderData();

  // for profile updates made by the user
  const [updatedProfile, setUpdatedProfile] = useState<Social | null>(loaderProfile);

  const socialProfile = updatedProfile ?? loaderProfile;
  const displayName = updatedProfile?.preferredName || user?.displayName || "Unknown User";

  return (
    <GradientBackground gradientPosition="bottomMiddle" className="scrollbar-hidden max-h-screen overflow-y-auto">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
        <div className="w-full max-w-3xl">
          <Tabs defaultValue="profile" className="flex flex-col items-center">
            <TabsList className="mb-6 inline-flex h-auto gap-1 rounded-lg border border-border-subtle px-2 py-1 backdrop-blur-sm">
              <TabsTrigger value="profile" className="transition-all duration-200">
                My profile
              </TabsTrigger>
              <TabsTrigger value="recently-viewed" className="transition-all duration-200">
                Recently viewed
              </TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="w-full">
              {user?.uid && user?.email && (
                <MyProfile
                  socialProfile={socialProfile}
                  onProfileUpdate={setUpdatedProfile}
                  uid={user.uid}
                  email={user.email}
                  displayName={displayName}
                />
              )}
            </TabsContent>
            <TabsContent value="recently-viewed" className="w-full">
              <RecentlyViewed />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </GradientBackground>
  );
}
