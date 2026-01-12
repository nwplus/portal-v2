import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Social, TagCategory } from "@/lib/firebase/types/socials";
import { Github, Globe, Instagram, Linkedin } from "lucide-react";
import { DEFAULT_PROFILE_INDEX, getProfilePicture, getTagBackgroundColor } from "./constants";
import { HackathonBadges } from "./hackathon-badges";

interface ViewProfileProps {
  socialProfile: Social;
}

/**
 * Read-only view of another user's social profile; respects privacy settings (tagsToHide).
 */
export function ViewProfile({ socialProfile }: ViewProfileProps) {
  const pronouns = socialProfile.pronouns;
  const bio = socialProfile.bio;
  const profilePictureIndex = socialProfile.profilePictureIndex ?? DEFAULT_PROFILE_INDEX;
  const profilePicture = getProfilePicture(profilePictureIndex);
  const displayName = socialProfile.preferredName || "Anonymous";

  const linkedin = socialProfile.socialLinks?.linkedin;
  const github = socialProfile.socialLinks?.github;
  const website = socialProfile.socialLinks?.website;
  const instagram = socialProfile.socialLinks?.instagram;
  const devpost = socialProfile.socialLinks?.devpost;

  const formatSocialUrl = (platform: string, username: string): string => {
    if (username.startsWith("http://") || username.startsWith("https://")) {
      return username;
    }

    const cleanUsername = username.replace(/^@/, "");

    switch (platform) {
      case "linkedin":
        return `https://www.linkedin.com/in/${cleanUsername}`;
      case "github":
        return `https://github.com/${cleanUsername}`;
      case "instagram":
        return `https://www.instagram.com/${cleanUsername}`;
      case "devpost":
        return `https://devpost.com/${cleanUsername}`;
      default:
        return username.startsWith("www.") ? `https://${username}` : username;
    }
  };

  const socials = [
    linkedin
      ? {
          icon: Linkedin,
          url: formatSocialUrl("linkedin", linkedin),
          displayText: linkedin,
          label: "LinkedIn",
        }
      : null,
    github
      ? {
          icon: Github,
          url: formatSocialUrl("github", github),
          displayText: github,
          label: "GitHub",
        }
      : null,
    website
      ? {
          icon: Globe,
          url: formatSocialUrl("website", website),
          displayText: website,
          label: "Website",
        }
      : null,
    instagram
      ? {
          icon: Instagram,
          url: formatSocialUrl("instagram", instagram),
          displayText: instagram,
          label: "Instagram",
        }
      : null,
    devpost
      ? {
          icon: Globe,
          url: formatSocialUrl("devpost", devpost),
          displayText: devpost,
          label: "Devpost",
        }
      : null,
  ].filter((social): social is NonNullable<typeof social> => social !== null);

  // Tags are populated from hackathon-specific application data
  const allTags: Array<{ text: string; category: TagCategory }> = [];
  if (socialProfile.school) allTags.push({ text: socialProfile.school, category: "school" });
  if (socialProfile.areaOfStudy)
    allTags.push({ text: socialProfile.areaOfStudy, category: "areaOfStudy" });
  if (socialProfile.year) allTags.push({ text: socialProfile.year, category: "year" });
  if (socialProfile.role) {
    const roles = socialProfile.role.split(", ");
    allTags.push(...roles.map((role) => ({ text: role, category: "role" as TagCategory })));
  }

  const hiddenCategories = new Set(socialProfile.tagsToHide || []);
  const visibleTags = allTags.filter((tag) => !hiddenCategories.has(tag.category));

  return (
    <div className="relative min-h-[500px] rounded-lg border border-border-subtle bg-[#292929]/30 px-6 py-10 backdrop-blur-md md:p-12">
      <div className="flex flex-col items-center text-center md:items-start md:text-left">
        <Avatar className="mb-4 size-30 md:size-36">
          <AvatarImage src={profilePicture ?? undefined} referrerPolicy="no-referrer" />
          <AvatarFallback className="text-2xl">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="mb-1 flex flex-col items-center gap-2 md:flex-row md:items-center">
          <h2 className="font-medium text-2xl text-text-primary">
            {displayName} {pronouns && <span className="text-text-secondary">({pronouns})</span>}
          </h2>
          <HackathonBadges hackathonsAttended={socialProfile.hackathonsAttended} size="md" />
        </div>

        <p className="mb-6 text-text-secondary">{bio || "No bio added"}</p>

        <div className="mb-6 w-full">
          <h3 className="mb-3 font-medium text-md text-text-primary">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {visibleTags.length > 0 ? (
              visibleTags.map((tag, index) => (
                <span
                  key={`${tag.text}-${index}`}
                  className="rounded px-3 py-1 font-medium text-sm text-text-primary"
                  style={{ backgroundColor: getTagBackgroundColor(profilePictureIndex) }}
                >
                  {tag.text}
                </span>
              ))
            ) : (
              <span className="text-sm text-text-secondary">No tags available</span>
            )}
          </div>
        </div>

        <div className="w-full">
          <h3 className="mb-3 font-semibold text-sm text-text-primary">Socials</h3>
          {socials.length > 0 ? (
            <div className="flex flex-col gap-2">
              {socials.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={`${social.label}-${index}`}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-text-primary hover:underline"
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="break-all text-sm">{social.displayText}</span>
                  </a>
                );
              })}
            </div>
          ) : (
            <span className="text-sm text-text-secondary">None added</span>
          )}
        </div>
      </div>
    </div>
  );
}
