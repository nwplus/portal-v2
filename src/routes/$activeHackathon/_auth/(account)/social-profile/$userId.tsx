import { GradientBackground } from "@/components/layout/gradient-background";
import { MyProfile } from "@/components/social-profile/my-profile";
import { RecentlyViewed } from "@/components/social-profile/recently-viewed";
import { ViewProfile } from "@/components/social-profile/view-profile";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHackathon } from "@/hooks/use-hackathon";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useHackerStore } from "@/lib/stores/hacker-store";
import { getPreferredName } from "@/lib/utils";
import { addToRecentlyViewed, fetchOrCreateSocial, fetchSocial } from "@/services/socials";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/$activeHackathon/_auth/(account)/social-profile/$userId")({
  loader: async ({ context, params }) => {
    const { dbCollectionName } = context;
    const { user } = useAuthStore.getState();
    const getOrFetchHacker = useHackerStore.getState().getOrFetch;

    const isOwnProfile = params.userId === user?.uid;

    if (isOwnProfile) {
      // Own profile: fetch/create social profile and hacker data
      if (!user?.uid || !user?.email || !dbCollectionName) {
        return { socialProfile: null, hacker: null, isOwnProfile: true };
      }

      const hacker = await getOrFetchHacker(dbCollectionName, user.uid);
      const socialProfile = await fetchOrCreateSocial(user.uid, user.email, hacker);

      return { socialProfile, hacker, isOwnProfile: true };
    }
    if (!user?.uid || !user?.email) {
      return { socialProfile: null, hacker: null, isOwnProfile: false };
    }

    const targetProfile = await fetchSocial(params.userId);

    if (!targetProfile) {
      throw notFound();
    }

    addToRecentlyViewed(user.uid, user.email, params.userId, targetProfile.preferredName).catch(
      (err) => console.error("Error adding to recently viewed:", err),
    );

    return { socialProfile: targetProfile, hacker: null, isOwnProfile: false };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const user = useAuthStore((state) => state.user);
  const { activeHackathon } = useHackathon();
  const { socialProfile, hacker, isOwnProfile } = Route.useLoaderData();

  if (!isOwnProfile) {
    return (
      <GradientBackground gradientPosition="bottomMiddle">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
          <div className="w-full max-w-3xl">
            <div className="mb-6">
              {user?.uid && (
                <Link
                  to="/$activeHackathon/social-profile/$userId"
                  params={{ activeHackathon, userId: user.uid }}
                >
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="size-4" />
                    Back
                  </Button>
                </Link>
              )}
            </div>

            {socialProfile && <ViewProfile socialProfile={socialProfile} />}
          </div>
        </div>
      </GradientBackground>
    );
  }

  // Show editable view for own profile
  const displayName = hacker ? getPreferredName(hacker) : "User";

  return (
    <GradientBackground gradientPosition="bottomMiddle">
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
              {user?.uid && user?.email && socialProfile ? (
                <MyProfile
                  socialProfile={socialProfile}
                  uid={user.uid}
                  email={user.email}
                  displayName={displayName}
                />
              ) : (
                /* Impossible case since guarded under _auth + we fallback on creating a doc */
                <div className="flex flex-col items-center justify-center">
                  <p className="text-text-secondary">No profile found</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="recently-viewed" className="w-full">
              <RecentlyViewed socialProfile={socialProfile} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </GradientBackground>
  );
}
