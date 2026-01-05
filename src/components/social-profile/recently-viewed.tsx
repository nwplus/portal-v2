import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type {
  RecentlyViewedProfile as RecentlyViewedProfileType,
  Social,
} from "@/lib/firebase/types/socials";
import { useAuthStore } from "@/lib/stores/auth-store";
import { fetchSocial, fetchSocialsByUids, removeFromRecentlyViewed } from "@/services/socials";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowUpRight, Loader2, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Input } from "../ui/input";
import { getProfilePicture } from "./constants";
import { HackathonBadges } from "./hackathon-badges";

interface RecentlyViewedItem {
  name: string;
  profileId: string;
  viewedAt: number;
  profile: Social | null;
}

interface RecentlyViewedProps {
  socialProfile?: Social | null;
  onProfileUpdate?: (profile: Social) => void;
}

export function RecentlyViewed({ socialProfile, onProfileUpdate }: RecentlyViewedProps) {
  const user = useAuthStore((state) => state.user);
  const { activeHackathon } = useParams({ strict: false });

  const [recentlyViewedItems, setRecentlyViewedItems] = useState<RecentlyViewedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [removingProfileId, setRemovingProfileId] = useState<string | null>(null);

  useEffect(() => {
    const loadRecentlyViewed = async () => {
      if (!user?.uid) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const currentSocial = socialProfile || (await fetchSocial(user.uid));
        const recentlyViewedList: RecentlyViewedProfileType[] =
          currentSocial?.recentlyViewedProfiles ?? [];

        if (recentlyViewedList.length === 0) {
          setRecentlyViewedItems([]);
          return;
        }

        const profileIds = recentlyViewedList.map((entry) => entry.profileId);
        const profiles = await fetchSocialsByUids(profileIds);

        const combined: RecentlyViewedItem[] = recentlyViewedList.map((entry, index) => ({
          name: entry.name,
          profileId: entry.profileId,
          viewedAt: entry.viewedAt,
          profile: profiles[index],
        }));

        setRecentlyViewedItems(combined);
      } catch (error) {
        // TODO: display user friendly error
        console.error("Error loading recently viewed profiles:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecentlyViewed();
  }, [user?.uid, socialProfile]);

  const handleRemove = useCallback(
    async (targetProfileId: string) => {
      if (!user?.uid || !user?.email) return;

      setRemovingProfileId(targetProfileId);

      try {
        await removeFromRecentlyViewed(user.uid, user.email, targetProfileId);

        setRecentlyViewedItems((prev) => prev.filter((p) => p.profileId !== targetProfileId));

        if (onProfileUpdate && socialProfile) {
          const updatedRecentlyViewed = (socialProfile.recentlyViewedProfiles ?? []).filter(
            (entry) => entry.profileId !== targetProfileId,
          );
          onProfileUpdate({
            ...socialProfile,
            recentlyViewedProfiles: updatedRecentlyViewed,
          });
        }
      } catch (error) {
        console.error("Error removing from recently viewed:", error);
      } finally {
        setRemovingProfileId(null);
      }
    },
    [user?.uid, user?.email, onProfileUpdate, socialProfile],
  );

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return recentlyViewedItems;

    const query = searchQuery.toLowerCase();
    return recentlyViewedItems.filter((item) => {
      return item.name.toLowerCase().includes(query);
    });
  }, [recentlyViewedItems, searchQuery]);

  if (isLoading) {
    return (
      <div className="min-h-[500px] rounded-lg border border-border-subtle bg-[#292929]/30 p-12 backdrop-blur-md">
        <h2 className="mb-6 font-medium text-2xl text-text-primary">Recently viewed by you</h2>
        <div className="flex items-center justify-center py-16">
          <div className="size-8 animate-spin rounded-full border-2 border-text-secondary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[500px] rounded-lg border border-border-subtle bg-[#292929]/30 p-12 backdrop-blur-md">
      <h2 className="mb-6 font-medium text-2xl text-text-primary">Recently viewed by you</h2>

      <div className="relative mb-8">
        <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-text-secondary" />
        <Input
          type="text"
          placeholder="Search recently viewed"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-border-subtle bg-bg-text-field py-2 pr-3 pl-10 text-sm text-text-primary placeholder:text-text-secondary focus:border-border-active focus:outline-none"
        />
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-4 pt-4 pb-16 text-center">
          {recentlyViewedItems.length === 0 ? (
            <>
              <p className="text-text-primary">You don't have any recently viewed profiles.</p>
              <p className="text-text-primary">
                Connect with another hacker and scan their QR
                <br />
                code to see their profile here! 🤝
              </p>
            </>
          ) : (
            <p className="text-text-secondary">No profiles match your search.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border-subtle">
          {filteredItems.map((item) => {
            const profilePicture = getProfilePicture(item.profile?.profilePictureIndex);

            return (
              <div
                key={item.profileId}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="size-8">
                    <AvatarImage src={profilePicture} referrerPolicy="no-referrer" />
                    <AvatarFallback className="text-lg">
                      {item.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-text-primary">{item.name}</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* TODO: add tooltip for every badge ie. hackcamp, nwhacks, cmd-f */}
                  <HackathonBadges hackathonsAttended={item.profile?.hackathonsAttended} />

                  <Link
                    to="/$activeHackathon/view-profile/$userId"
                    params={{
                      activeHackathon: activeHackathon ?? "nwhacks",
                      userId: item.profileId,
                    }}
                    className="p-1.5 text-text-secondary transition-colors hover:text-text-primary"
                    title="View profile"
                  >
                    <ArrowUpRight className="size-5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleRemove(item.profileId)}
                    disabled={removingProfileId !== null}
                    className="p-1.5 text-text-error transition-colors hover:cursor-pointer hover:text-red-400 disabled:cursor-not-allowed"
                    title="Remove"
                  >
                    {removingProfileId === item.profileId ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <X className="size-5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
