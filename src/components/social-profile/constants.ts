export const PROFILE_PICTURES = [
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
  
  export const SELECTABLE_PICTURES = PROFILE_PICTURES.slice(1);
  
  export const DEFAULT_PROFILE_INDEX = 0;
  
  export const NUGGET_TAG_COLORS = [
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
  
  export function getProfilePicture(profilePictureIndex?: number): string {
    return PROFILE_PICTURES[profilePictureIndex ?? DEFAULT_PROFILE_INDEX];
  }
  
  export function getTagBackgroundColor(profileIndex: number): string {
    return NUGGET_TAG_COLORS[profileIndex] || NUGGET_TAG_COLORS[DEFAULT_PROFILE_INDEX];
  }