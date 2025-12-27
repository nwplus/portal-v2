import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validatePronouns, validateSocialUsername, validateWebsite } from "@/lib/application/utils";
import type { Social, TagCategory } from "@/lib/firebase/types/socials";
import { createOrMergeSocial } from "@/services/socials";
import { Github, Globe, Instagram, Linkedin } from "lucide-react";
import { useState } from "react";

const PROFILE_PICTURES = [
  "/assets/profiles/default-nugget.svg",
  "/assets/profiles/nugget-strawberry.svg",
  "/assets/profiles/hacker-nugget.svg",
  "/assets/profiles/martin-nugget.svg",
  "/assets/profiles/furry-nugget.svg",
  "/assets/profiles/ramen-nugget.svg",
  "/assets/profiles/nugget-lebron.svg",
  "/assets/profiles/jacked-nugget.svg",
  "/assets/profiles/crafting-nugget.svg",
  "/assets/profiles/hawaii-nugget.svg",
  "/assets/profiles/fairy-nugget.svg",
  "/assets/profiles/everything-is-ok-nugget.svg",
  "/assets/profiles/tears-nugget.svg",
] as const;

const NUGGET_TAG_COLORS = [
  "#6B7280", // default-nugget
  "#9f3738", // nugget-strawberry
  "#5d8a15", // hacker-nugget
  "#148578", // martin-nugget
  "#7d3cc7", // furry-nugget
  "#9d2db8", // ramen-nugget
  "#b8440b", // nugget-lebron
  "#6841c5", // jacked-nugget
  "#0a6c85", // crafting-nugget
  "#05649a", // hawaii-nugget
  "#b82872", // fairy-nugget
  "#b8860f", // everything-is-ok-nugget
  "#3d38b0", // tears-nugget
] as const;

const SELECTABLE_PICTURES = PROFILE_PICTURES.slice(1); // default profile pic is not selectable
const DEFAULT_PROFILE_INDEX = 0;
const MAX_BIO_WORDS = 20;
const MAX_PRONOUNS_LENGTH = 15;

const getTagBackgroundColor = (profileIndex: number): string => {
  return NUGGET_TAG_COLORS[profileIndex] || NUGGET_TAG_COLORS[DEFAULT_PROFILE_INDEX];
};

type ProfileMode = "view" | "edit" | "select-picture";

interface MyProfileProps {
  socialProfile: Social | null;
  onProfileUpdate: (profile: Social) => void;
  uid: string;
  email: string;
  displayName: string;
}

export function MyProfile({
  socialProfile,
  onProfileUpdate,
  uid,
  email,
  displayName,
}: MyProfileProps) {
  const [profileMode, setProfileMode] = useState<ProfileMode>("view");
  const [isSaving, setIsSaving] = useState(false);

  const [editBio, setEditBio] = useState("");
  const [editLinkedin, setEditLinkedin] = useState("");
  const [editGithub, setEditGithub] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editInstagram, setEditInstagram] = useState("");
  const [editDevpost, setEditDevpost] = useState("");
  const [editPronouns, setEditPronouns] = useState("");
  const [editProfilePictureIndex, setEditProfilePictureIndex] = useState(DEFAULT_PROFILE_INDEX);
  const [editTagsToHide, setEditTagsToHide] = useState<TagCategory[]>([]);

  const [errors, setErrors] = useState({
    pronouns: "",
    linkedin: "",
    github: "",
    website: "",
    instagram: "",
    devpost: "",
  });

  const pronouns = socialProfile?.pronouns;
  const bio = socialProfile?.bio;
  const profilePictureIndex = socialProfile?.profilePictureIndex ?? DEFAULT_PROFILE_INDEX;
  const profilePicture = PROFILE_PICTURES[profilePictureIndex];

  const linkedin = socialProfile?.socialLinks?.linkedin;
  const github = socialProfile?.socialLinks?.github;
  const website = socialProfile?.socialLinks?.website;
  const instagram = socialProfile?.socialLinks?.instagram;
  const devpost = socialProfile?.socialLinks?.devpost;

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
  if (socialProfile?.school) allTags.push({ text: socialProfile.school, category: "school" });
  if (socialProfile?.areaOfStudy)
    allTags.push({ text: socialProfile.areaOfStudy, category: "areaOfStudy" });
  if (socialProfile?.year) allTags.push({ text: socialProfile.year, category: "year" });
  if (socialProfile?.role) {
    const roles = socialProfile.role.split(", ");
    allTags.push(...roles.map((role) => ({ text: role, category: "role" as TagCategory })));
  }

  const hiddenCategories = new Set(socialProfile?.tagsToHide || []);
  const visibleTags = allTags.filter((tag) => !hiddenCategories.has(tag.category));

  const handleOpenEdit = () => {
    setEditBio(bio || "");
    setEditPronouns(pronouns || "");
    setEditLinkedin(linkedin || "");
    setEditGithub(github || "");
    setEditWebsite(website || "");
    setEditInstagram(instagram || "");
    setEditDevpost(devpost || "");
    setEditProfilePictureIndex(profilePictureIndex);
    setEditTagsToHide(socialProfile?.tagsToHide || []);
    setErrors({ pronouns: "", linkedin: "", github: "", website: "", instagram: "", devpost: "" });
    setProfileMode("edit");
  };

  const bioWordCount = editBio.trim().split(/\s+/).filter(Boolean).length;

  const handleSave = async () => {
    if (bioWordCount > MAX_BIO_WORDS) {
      return;
    }

    const pronounsError = validatePronouns(editPronouns, MAX_PRONOUNS_LENGTH);
    const linkedinError = validateSocialUsername(editLinkedin, "LinkedIn");
    const githubError = validateSocialUsername(editGithub, "GitHub");
    const instagramError = validateSocialUsername(editInstagram, "Instagram");
    const devpostError = validateSocialUsername(editDevpost, "Devpost");
    const websiteError = validateWebsite(editWebsite);

    setErrors({
      pronouns: pronounsError || "",
      linkedin: linkedinError || "",
      github: githubError || "",
      website: websiteError || "",
      instagram: instagramError || "",
      devpost: devpostError || "",
    });

    if (
      pronounsError ||
      linkedinError ||
      githubError ||
      instagramError ||
      devpostError ||
      websiteError
    ) {
      return;
    }

    try {
      setIsSaving(true);

      const socialData = {
        _id: uid,
        email,
        preferredName: socialProfile?.preferredName,
        pronouns: editPronouns.trim() || undefined,
        bio: editBio.trim() || undefined,
        profilePictureIndex: editProfilePictureIndex,
        areaOfStudy: socialProfile?.areaOfStudy,
        school: socialProfile?.school,
        year: socialProfile?.year,
        role: socialProfile?.role,
        hideRecentlyViewed: socialProfile?.hideRecentlyViewed ?? false,
        tagsToHide: editTagsToHide.length > 0 ? editTagsToHide : undefined,
        socialLinks: {
          linkedin: editLinkedin.trim() || undefined,
          github: editGithub.trim() || undefined,
          website: editWebsite.trim() || undefined,
          instagram: editInstagram.trim() || undefined,
          devpost: editDevpost.trim() || undefined,
        },
      };

      await createOrMergeSocial(uid, email, socialData);

      onProfileUpdate({
        ...socialProfile,
        ...socialData,
      });

      setProfileMode("view");
    } catch (error) {
      console.error("Error saving profile:", error);

      const firebaseError = error as { code?: string; message?: string };

      if (firebaseError.code) {
        switch (firebaseError.code) {
          case "permission-denied":
            alert("You don't have permission to update this profile.");
            break;
          case "unavailable":
          case "failed-precondition":
            alert("Network error. Please check your connection and try again.");
            break;
          case "unauthenticated":
            alert("Your session has expired. Please log in again.");
            break;
          case "not-found":
            alert("Profile not found. Please refresh the page and try again.");
            break;
          default:
            alert(`Failed to save profile: ${firebaseError.message || "Unknown error"}`);
        }
      } else {
        alert(`Failed to save profile: ${firebaseError.message || "Unknown error"}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (profileMode === "view") {
    return (
      <div className="relative min-h-[500px] rounded-lg border border-border-subtle bg-[#292929]/30 px-6 py-10 backdrop-blur-md md:p-12">
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-4 right-4"
          onClick={handleOpenEdit}
        >
          Edit <span className="hidden md:inline">Profile</span>
        </Button>

        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <Avatar className="mb-4 size-30 md:size-36">
            <AvatarImage src={profilePicture ?? undefined} referrerPolicy="no-referrer" />
            <AvatarFallback className="text-2xl">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <h2 className="mb-1 font-medium text-2xl text-text-primary">
            {displayName} {pronouns && <span className="text-text-secondary">({pronouns})</span>}
          </h2>

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

  if (profileMode === "edit") {
    return (
      <div className="min-h-[500px] rounded-lg border border-border-subtle bg-[#292929]/30 px-6 py-10 backdrop-blur-md md:p-12">
        <div className="space-y-6">
          <div className="flex justify-between">
            <div className="flex items-center gap-12">
              <Avatar
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setProfileMode("select-picture");
                  }
                }}
                className="size-30 cursor-pointer md:size-36 md:cursor-default"
              >
                <AvatarImage src={PROFILE_PICTURES[editProfilePictureIndex]} />
                <AvatarFallback className="text-2xl">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="secondary"
                size="default"
                className="hidden md:block"
                onClick={() => setProfileMode("select-picture")}
              >
                Choose profile photo
              </Button>
            </div>

            <div className="absolute top-6 right-6 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setProfileMode("view")}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSave}
                disabled={
                  isSaving ||
                  bioWordCount > MAX_BIO_WORDS ||
                  editPronouns.length > MAX_PRONOUNS_LENGTH
                }
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-3xl text-text-primary">
              {displayName} {pronouns && <span className="text-text-secondary">({pronouns})</span>}
            </h3>
          </div>

          <div>
            <h4 className="mb-2 font-medium text-md text-text-primary">Pronouns</h4>
            <Input
              type="text"
              placeholder="e.g. she/her, he/him, they/them"
              value={editPronouns}
              onChange={(e) => setEditPronouns(e.target.value)}
              className="text-base"
            />
            <div className="mt-1 flex items-center justify-between text-xs">
              {errors.pronouns && <span className="text-text-error">{errors.pronouns}</span>}
              <span
                className={
                  editPronouns.length > MAX_PRONOUNS_LENGTH
                    ? "text-text-error"
                    : "text-text-secondary"
                }
              >
                {editPronouns.length}/{MAX_PRONOUNS_LENGTH} characters
              </span>
            </div>
          </div>

          <div>
            <h4 className="mb-2 font-medium text-md text-text-primary">Bio</h4>
            <textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              rows={1}
              className="w-full resize-none rounded-md border border-border-subtle bg-bg-text-field px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-border-active focus:outline-none"
            />
            <div className="mt-1 flex items-center justify-between text-xs">
              <span
                className={bioWordCount > MAX_BIO_WORDS ? "text-text-error" : "text-text-secondary"}
              >
                {bioWordCount} words
              </span>
              <span className="text-text-secondary">Max {MAX_BIO_WORDS} words</span>
            </div>
          </div>

          <div>
            <h4 className="mb-3 font-medium text-md text-text-primary">Tags</h4>
            <p className="mb-3 text-text-secondary text-xs">
              Auto-generated from your application. Click any tag to hide/show its category on your
              profile.
            </p>
            <div className="flex flex-wrap gap-2">
              {allTags.length > 0 ? (
                allTags.map((tag, index) => {
                  const isHidden = editTagsToHide.includes(tag.category);
                  const tagColor = getTagBackgroundColor(editProfilePictureIndex);
                  return (
                    <button
                      type="button"
                      key={`${tag.text}-${index}`}
                      onClick={() => {
                        setEditTagsToHide((prev) =>
                          isHidden
                            ? prev.filter((cat) => cat !== tag.category)
                            : [...prev, tag.category],
                        );
                      }}
                      className={`rounded px-3 py-1.5 font-medium text-sm transition-opacity ${
                        isHidden
                          ? "text-text-secondary line-through opacity-50"
                          : "text-text-primary"
                      }`}
                      style={{
                        backgroundColor: isHidden ? `${tagColor}30` : tagColor,
                      }}
                    >
                      {tag.text}
                    </button>
                  );
                })
              ) : (
                <span className="text-sm text-text-secondary">
                  No tags available. Complete your application to generate tags.
                </span>
              )}
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-medium text-base text-text-primary">Socials</h4>
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-3">
                  <Linkedin className="size-6 shrink-0 text-text-secondary" />
                  <Input
                    type="text"
                    placeholder="@username"
                    value={editLinkedin}
                    onChange={(e) => setEditLinkedin(e.target.value)}
                    className="text-base"
                  />
                </div>
                {errors.linkedin && (
                  <p className="mt-1 ml-9 text-text-error text-xs">{errors.linkedin}</p>
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full border border-text-secondary text-text-secondary">
                    <span className="font-bold text-xs">D</span>
                  </div>
                  <Input
                    type="text"
                    placeholder="@username"
                    value={editDevpost}
                    onChange={(e) => setEditDevpost(e.target.value)}
                    className="text-base"
                  />
                </div>
                {errors.devpost && (
                  <p className="mt-1 ml-9 text-text-error text-xs">{errors.devpost}</p>
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <Globe className="size-6 shrink-0 text-text-secondary" />
                  <Input
                    type="url"
                    placeholder="www.example.com"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    className="text-base"
                  />
                </div>
                {errors.website && (
                  <p className="mt-1 ml-9 text-text-error text-xs">{errors.website}</p>
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <Instagram className="size-6 shrink-0 text-text-secondary" />
                  <Input
                    type="text"
                    placeholder="@username"
                    value={editInstagram}
                    onChange={(e) => setEditInstagram(e.target.value)}
                    className="text-base"
                  />
                </div>
                {errors.instagram && (
                  <p className="mt-1 ml-9 text-text-error text-xs">{errors.instagram}</p>
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <Github className="size-6 shrink-0 text-text-secondary" />
                  <Input
                    type="text"
                    placeholder="@username"
                    value={editGithub}
                    onChange={(e) => setEditGithub(e.target.value)}
                    className="text-base"
                  />
                </div>
                {errors.github && (
                  <p className="mt-1 ml-9 text-text-error text-xs">{errors.github}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // select-picture mode
  return (
    <div className="mx-auto min-h-[500px] max-w-2xl rounded-lg border border-border-subtle bg-[#292929]/30 px-6 py-10 backdrop-blur-md md:p-12">
      <div className="flex justify-center">
        <div className="grid grid-cols-3 place-items-center gap-8">
          {SELECTABLE_PICTURES.map((picture, index) => {
            const actualIndex = index + 1;
            return (
              <button
                key={actualIndex}
                type="button"
                onClick={() => setEditProfilePictureIndex(actualIndex)}
                className={`group relative size-24 overflow-hidden rounded-full transition-all hover:scale-105 md:size-36 ${
                  editProfilePictureIndex === actualIndex
                    ? "ring-4 ring-border-active"
                    : "hover:ring-2 hover:ring-border-subtle"
                }`}
              >
                <img
                  src={picture}
                  alt={`Profile ${actualIndex}`}
                  className="size-full object-cover"
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <Button variant="ghost" onClick={() => setProfileMode("edit")}>
          Cancel
        </Button>
        <Button variant="secondary" onClick={() => setProfileMode("edit")}>
          Save
        </Button>
      </div>
    </div>
  );
}
