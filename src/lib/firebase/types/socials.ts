/**
 * Tag categories that can be hidden from the social profile
 */
export type TagCategory = "school" | "areaOfStudy" | "year" | "role";

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
  unlockedStamps?: Set<string>; // set of stamp IDs
  socialLinks?: {
    devpost?: string;
    github?: string;
    instagram?: string;
    linkedin?: string;
    website?: string;
  };
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
