/**
 * Tag categories that can be hidden from the social profile
 */
export type TagCategory = "school" | "areaOfStudy" | "year" | "role";

/**
 * Entry in the recently viewed profiles list
 * Stored as an LRU cache with max 10 entries
 */
export interface RecentlyViewedProfile {
  name: string;
  profileId: string;
  viewedAt: number; // timestamp in ms
}

/**
 * Tracks which hackathons a user has attended
 * Determined automatically from hackathon attendance status
 */
export interface HackathonsAttended {
  hackcamp: boolean;
  nwhacks: boolean;
  "cmd-f": boolean;
}

/**
 * Social profile - global across all hackathons
 * Users manually fill out their profile information
 * Path: Socials/{uid}
 */
export interface Social {
  _id: string;
  email: string;
  preferredName?: string;
  pronouns?: string;
  bio?: string;
  areaOfStudy?: string;
  school?: string;
  year?: string;
  role?: string;
  profilePictureIndex?: number;
  hideRecentlyViewed?: boolean;
  tagsToHide?: TagCategory[];
  socialLinks?: {
    devpost?: string;
    github?: string;
    instagram?: string;
    linkedin?: string;
    website?: string;
  };
  recentlyViewedProfiles?: RecentlyViewedProfile[];
  hackathonsAttended?: HackathonsAttended;
}

/**
 * Social profiles are global and shared across all hackathons
 * They are bound to the user's UID (primary key) and email
 * This allows users to maintain a single profile across all nwPlus events
 */
export type SocialDraft = Partial<Social> & {
  _id: string;
  email: string;
};
