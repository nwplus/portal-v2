import { GradientBackground } from "@/components/layout/gradient-background";
import { ViewProfile } from "@/components/social-profile/view-profile";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Social } from "@/lib/firebase/types/socials";
import { useAuthStore } from "@/lib/stores/auth-store";
import { loadAuth } from "@/lib/utils";
import { addToRecentlyViewed, fetchSocial } from "@/services/socials";
import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/$activeHackathon/_auth/(account)/view-profile/$userId")({
  beforeLoad: async ({ params }) => {
    await loadAuth();
    const { user } = useAuthStore.getState();

    // If user is viewing their own profile, redirect to my-profile
    if (user?.uid && params.userId === user.uid) {
      throw redirect({
        to: "/$activeHackathon/social-profile",
        params: { activeHackathon: params.activeHackathon },
        replace: true,
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { userId } = Route.useParams();
  const { activeHackathon } = Route.useParams();
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [targetProfile, setTargetProfile] = useState<Social | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !user?.uid || !user?.email) return;

    // Double-check: if viewing own profile, redirect (fallback in case beforeLoad didn't catch it)
    if (userId === user.uid) {
      navigate({
        to: "/$activeHackathon/social-profile",
        params: { activeHackathon },
        replace: true,
      });
      return;
    }

    const uid = user.uid;
    const email = user.email;

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch the target user's social profile
        const profile = await fetchSocial(userId);

        if (!profile) {
          setError("Profile not found");
          return;
        }

        setTargetProfile(profile);

        await addToRecentlyViewed(uid, email, userId, profile.preferredName);
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [userId, user?.uid, user?.email, activeHackathon, navigate]);

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

  if (error || !targetProfile) {
    return (
      <GradientBackground
        gradientPosition="bottomMiddle"
        className="max-h-screen overflow-y-scroll"
      >
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 p-6">
          <p className="text-sm text-text-error">{error || "Profile not found"}</p>
          <Link to="/$activeHackathon/social-profile" params={{ activeHackathon }}>
            <Button variant="secondary">Back to My Profile</Button>
          </Link>
        </div>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground gradientPosition="bottomMiddle" className="max-h-screen overflow-y-scroll">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
        <div className="w-full max-w-3xl">
          <div className="mb-6">
            <Link to="/$activeHackathon/social-profile" params={{ activeHackathon }}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="size-4" />
                Back
              </Button>
            </Link>
          </div>

          <ViewProfile socialProfile={targetProfile} />
        </div>
      </div>
    </GradientBackground>
  );
}
