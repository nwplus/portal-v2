import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Social, TagCategory } from "@/lib/firebase/types/socials";
import {
  MAX_BIO_WORDS,
  MAX_PRONOUNS_LENGTH,
  type SocialProfileFormValues,
  deriveDefaultValues,
  socialProfileSchema,
} from "@/lib/social-profile/schema";
import { createOrMergeSocial } from "@/services/socials";
import { zodResolver } from "@hookform/resolvers/zod";
import { Github, Globe, Instagram, Linkedin } from "lucide-react";
import { useState } from "react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { getProfilePicture, getTagBackgroundColor } from "./constants";
import ProfilePicturePicker from "./profile-picture-picker";
import ProfileView from "./profile-view";
type ProfileMode = "view" | "select-picture" | "edit";

interface MyProfileProps {
  socialProfile: Social;
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

  // Stores profile picture while on edit/view mode, before editing it in the select-picture mode.
  // Enables 'Cancel' button on the select-picture mode to revert changes.
  const [cachedProfilePictureIdx, setCachedProfilePictureIdx] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SocialProfileFormValues>({
    // biome-ignore lint/suspicious/noExplicitAny: resolver's generics do not align cleanly with our schema type, but runtime shapes match SocialProfileFormValues
    resolver: zodResolver(socialProfileSchema as any) as Resolver<SocialProfileFormValues>,
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: deriveDefaultValues(socialProfile),
  });

  const watchedBio = watch("bio") ?? "";
  const watchedPronouns = watch("pronouns") ?? "";
  const watchedProfilePictureIndex = watch("profilePictureIndex");
  const watchedTagsToHide = watch("tagsToHide");

  const bioWordCount = watchedBio.trim().split(/\s+/).filter(Boolean).length;

  const handleOpenEdit = () => {
    reset(deriveDefaultValues(socialProfile));
    setProfileMode("edit");
  };

  const handleCancel = () => {
    reset(deriveDefaultValues(socialProfile));
    setProfileMode("view");
  };

  const onSubmit = async (data: SocialProfileFormValues) => {
    try {
      setIsSaving(true);

      const socialData = {
        _id: uid,
        email,
        preferredName: socialProfile?.preferredName,
        pronouns: data.pronouns?.trim() || "",
        bio: data.bio?.trim() || "",
        profilePictureIndex: data.profilePictureIndex,
        areaOfStudy: socialProfile?.areaOfStudy,
        school: socialProfile?.school,
        year: socialProfile?.year,
        role: socialProfile?.role,
        hideRecentlyViewed: socialProfile?.hideRecentlyViewed ?? false,
        tagsToHide: data.tagsToHide.length > 0 ? data.tagsToHide : [],
        socialLinks: {
          linkedin: data.socialLinks.linkedin?.trim() || "",
          github: data.socialLinks.github?.trim() || "",
          website: data.socialLinks.website?.trim() || "",
          instagram: data.socialLinks.instagram?.trim() || "",
          devpost: data.socialLinks.devpost?.trim() || "",
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

  // Tags are populated from the current hackathon's application data
  const allTags: Array<{ text: string; category: TagCategory }> = [];
  if (socialProfile?.school) allTags.push({ text: socialProfile.school, category: "school" });
  if (socialProfile?.areaOfStudy)
    allTags.push({ text: socialProfile.areaOfStudy, category: "areaOfStudy" });
  if (socialProfile?.year) allTags.push({ text: socialProfile.year, category: "year" });
  if (socialProfile?.role) {
    const roles = socialProfile.role.split(", ");
    allTags.push(...roles.map((role) => ({ text: role, category: "role" as TagCategory })));
  }

  const toggleTagVisibility = (category: TagCategory) => {
    const current = watchedTagsToHide;
    const isHidden = current.includes(category);
    setValue(
      "tagsToHide",
      isHidden ? current.filter((cat) => cat !== category) : [...current, category],
    );
  };

  if (profileMode === "view") {
    return <ProfileView socialProfile={socialProfile} onEdit={handleOpenEdit} allTags={allTags} />;
  }

  if (profileMode === "select-picture") {
    return (
      <ProfilePicturePicker
        profilePictureIndex={watchedProfilePictureIndex}
        onSelect={(index) => {
          setValue("profilePictureIndex", index);
        }}
        onCancel={() => {
          if (cachedProfilePictureIdx !== null) {
            setValue("profilePictureIndex", cachedProfilePictureIdx);
          }
          setProfileMode("edit");
        }}
        onSave={() => setProfileMode("edit")}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="min-h-[500px] rounded-lg border border-border-subtle bg-[#292929]/30 px-6 py-10 backdrop-blur-md md:p-12"
    >
      <div className="space-y-6">
        <div className="flex justify-between">
          <div className="flex items-center gap-12">
            <Avatar
              onClick={() => {
                if (window.innerWidth < 768) {
                  setCachedProfilePictureIdx(watchedProfilePictureIndex);
                  setProfileMode("select-picture");
                }
              }}
              className="size-30 cursor-pointer md:size-36 md:cursor-default"
            >
              <AvatarImage src={getProfilePicture(watchedProfilePictureIndex)} />
              <AvatarFallback className="text-2xl">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button
              type="button"
              variant="secondary"
              size="default"
              className="hidden md:block"
              onClick={() => {
                setCachedProfilePictureIdx(watchedProfilePictureIndex);
                setProfileMode("select-picture");
              }}
            >
              Choose profile photo
            </Button>
          </div>

          <div className="absolute top-6 right-6 flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={
                isSaving ||
                bioWordCount > MAX_BIO_WORDS ||
                watchedPronouns.length > MAX_PRONOUNS_LENGTH
              }
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-3xl text-text-primary">
            {displayName}{" "}
            {socialProfile?.pronouns && (
              <span className="text-text-secondary">({socialProfile?.pronouns})</span>
            )}
          </h3>
        </div>

        <div>
          <h4 className="mb-2 font-medium text-md text-text-primary">Pronouns</h4>
          <Input
            type="text"
            placeholder="e.g. she/her, he/him, they/them"
            {...register("pronouns")}
            className="text-base"
          />
          <div className="mt-1 flex items-center justify-between text-xs">
            {errors.pronouns && <span className="text-text-error">{errors.pronouns.message}</span>}
            <span
              className={
                watchedPronouns.length > MAX_PRONOUNS_LENGTH
                  ? "text-text-error"
                  : "text-text-secondary"
              }
            >
              {watchedPronouns.length}/{MAX_PRONOUNS_LENGTH} characters
            </span>
          </div>
        </div>

        <div>
          <h4 className="mb-2 font-medium text-md text-text-primary">Bio</h4>
          <Textarea
            placeholder="Tell us about yourself..."
            {...register("bio")}
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
          {errors.bio && <p className="mt-1 text-text-error text-xs">{errors.bio.message}</p>}
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
                const isHidden = watchedTagsToHide.includes(tag.category);
                const tagColor = getTagBackgroundColor(watchedProfilePictureIndex);
                return (
                  <button
                    type="button"
                    key={`${tag.text}-${index}`}
                    onClick={() => toggleTagVisibility(tag.category)}
                    className={`rounded-lg px-3 py-1.5 font-medium text-sm transition-opacity ${
                      isHidden ? "text-text-secondary line-through opacity-50" : "text-text-primary"
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
                  placeholder="username"
                  {...register("socialLinks.linkedin")}
                  className="text-base"
                />
              </div>
              {errors.socialLinks?.linkedin && (
                <p className="mt-1 ml-9 text-text-error text-xs">
                  {errors.socialLinks.linkedin.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full border border-text-secondary text-text-secondary">
                  <span className="font-bold text-xs">D</span>
                </div>
                <Input
                  type="text"
                  placeholder="username"
                  {...register("socialLinks.devpost")}
                  className="text-base"
                />
              </div>
              {errors.socialLinks?.devpost && (
                <p className="mt-1 ml-9 text-text-error text-xs">
                  {errors.socialLinks.devpost.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <Globe className="size-6 shrink-0 text-text-secondary" />
                <Input
                  type="text"
                  placeholder="www.example.com"
                  {...register("socialLinks.website")}
                  className="text-base"
                />
              </div>
              {errors.socialLinks?.website && (
                <p className="mt-1 ml-9 text-text-error text-xs">
                  {errors.socialLinks.website.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <Instagram className="size-6 shrink-0 text-text-secondary" />
                <Input
                  type="text"
                  placeholder="@username"
                  {...register("socialLinks.instagram")}
                  className="text-base"
                />
              </div>
              {errors.socialLinks?.instagram && (
                <p className="mt-1 ml-9 text-text-error text-xs">
                  {errors.socialLinks.instagram.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <Github className="size-6 shrink-0 text-text-secondary" />
                <Input
                  type="text"
                  placeholder="username"
                  {...register("socialLinks.github")}
                  className="text-base"
                />
              </div>
              {errors.socialLinks?.github && (
                <p className="mt-1 ml-9 text-text-error text-xs">
                  {errors.socialLinks.github.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
