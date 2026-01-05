import { z } from "zod";

export const MAX_BIO_WORDS = 20;
export const MAX_PRONOUNS_LENGTH = 15;

/**
 * Validates pronouns field content.
 * Checks for reasonable length and prevents URLs.
 */
function validatePronouns(value: string): boolean {
  if (!value.trim()) return true;
  if (value.includes("http://") || value.includes("https://")) return false;
  return true;
}

/**
 * Validates social media username or URL.
 * Accepts both full URLs and username formats (with or without @).
 */
function validateSocialUsername(value: string): boolean {
  if (!value.trim()) return true;

  const trimmed = value.trim();

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      new URL(trimmed);
      return true;
    } catch {
      return false;
    }
  }

  if (/\s/.test(trimmed)) return false;
  if (!/^[@\w.-]+$/.test(trimmed)) return false;

  return true;
}

/**
 * Validates website URL or domain.
 * Accepts full URLs, www. prefixed domains, or bare domains.
 */
function validateWebsite(value: string): boolean {
  if (!value.trim()) return true;

  const trimmed = value.trim();
  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  
  try {
    const url = new URL(normalized);
    return url.hostname.includes(".");
  } catch {
    return false;
  }
}

/**
 * Counts words in a string; used to validate open-ended fields.
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export const socialProfileSchema = z.object({
  pronouns: z
    .string()
    .max(MAX_PRONOUNS_LENGTH, `Must be ${MAX_PRONOUNS_LENGTH} characters or less`)
    .refine(validatePronouns, "Pronouns cannot contain URLs")
    .optional()
    .or(z.literal("")),

  bio: z
    .string()
    .refine(
      (val) => !val || countWords(val) <= MAX_BIO_WORDS,
      `Must be at most ${MAX_BIO_WORDS} words`,
    )
    .optional()
    .or(z.literal("")),

  profilePictureIndex: z.number().min(0).max(12),

  tagsToHide: z.array(z.enum(["school", "areaOfStudy", "year", "role"])),

  socialLinks: z.object({
    linkedin: z
      .string()
      .refine(validateSocialUsername, "Invalid LinkedIn username or URL")
      .optional()
      .or(z.literal("")),
    github: z
      .string()
      .refine(validateSocialUsername, "Invalid GitHub username or URL")
      .optional()
      .or(z.literal("")),
    website: z
      .string()
      .refine(validateWebsite, "Please enter a valid website URL or domain")
      .optional()
      .or(z.literal("")),
    instagram: z
      .string()
      .refine(validateSocialUsername, "Invalid Instagram username or URL")
      .optional()
      .or(z.literal("")),
    devpost: z
      .string()
      .refine(validateSocialUsername, "Invalid Devpost username or URL")
      .optional()
      .or(z.literal("")),
  }),
});

export type SocialProfileFormValues = z.infer<typeof socialProfileSchema>;

/**
 * Derives form default values from an existing Social profile
 */
export function deriveDefaultValues(
  profile: {
    pronouns?: string;
    bio?: string;
    profilePictureIndex?: number;
    tagsToHide?: Array<"school" | "areaOfStudy" | "year" | "role">;
    socialLinks?: {
      linkedin?: string;
      github?: string;
      website?: string;
      instagram?: string;
      devpost?: string;
    };
  } | null,
): SocialProfileFormValues {
  return {
    pronouns: profile?.pronouns ?? "",
    bio: profile?.bio ?? "",
    profilePictureIndex: profile?.profilePictureIndex ?? 0,
    tagsToHide: profile?.tagsToHide ?? [],
    socialLinks: {
      linkedin: profile?.socialLinks?.linkedin ?? "",
      github: profile?.socialLinks?.github ?? "",
      website: profile?.socialLinks?.website ?? "",
      instagram: profile?.socialLinks?.instagram ?? "",
      devpost: profile?.socialLinks?.devpost ?? "",
    },
  };
}
