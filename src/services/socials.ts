import { db } from "@/lib/firebase/client";
import type { Applicant, ApplicantContribution, ApplicantMajor } from "@/lib/firebase/types/applicants";
import type { Social, SocialDraft } from "@/lib/firebase/types/socials";
import { type DocumentData, type DocumentReference, doc, getDoc, setDoc } from "firebase/firestore";

/**
 * Utility to get a typed reference to the social document for a given user
 * Path: `Socials/{uid}`
 *
 * @param uid - firebase auth user id (also used as the document id)
 * @returns firestore document reference to the user's social doc
 */
function getSocialRef(uid: string): DocumentReference<DocumentData> {
  return doc(db, "Socials", uid);
}

/**
 * Converts an applicant's major data into a user-friendly display name
 * Handles both single major strings and multi-select major objects
 *
 * @param major - applicant's major from the application (string or object with boolean flags)
 * @returns display name for the major; undefined if no major selected
 */
function getMajorDisplayName(
  major?: ApplicantMajor | Record<ApplicantMajor, boolean | undefined>,
): string | undefined {
  if (!major) return undefined;

  const majorMap: Record<ApplicantMajor, string> = {
    computerScience: "Computer Science",
    otherEngineering: "Engineering",
    informationTech: "Information Technology",
    naturalScience: "Natural Science",
    mathOrStats: "Math/Stats",
    webDevOrDesign: "Web Dev/Design",
    business: "Business",
    humanities: "Humanities",
    socialScience: "Social Science",
    arts: "Arts",
    healthScience: "Health Science",
    other: "Other",
    undecidedOrUndeclared: "Undecided",
    schoolDoesNotOfferMajors: "No Major",
    preferNotToAnswer: "Prefer Not to Answer",
  };

  if (typeof major === "string") {
    return majorMap[major] || undefined;
  }

  const selectedMajors = Object.entries(major)
    .filter(([_, selected]) => selected === true)
    .map(([key]) => key);

  if (selectedMajors.length > 0) {
    const firstMajor = selectedMajors[0];
    return majorMap[firstMajor as ApplicantMajor] || selectedMajors[0];
  }

  return undefined;
}

/**
 * Calculates a user's year level based on their graduation year
 * Accounts for academic year (starts September) when determining year level
 *
 * @param graduationYear - the year the user expects to graduate
 * @returns year level display string (e.g. "Second Year", "Graduate"); undefined if no graduation year provided
 */
function getYearLevel(graduationYear?: number): string | undefined {
  if (!graduationYear) return undefined;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const academicYear = currentMonth >= 8 ? currentYear : currentYear - 1;
  const yearsUntilGrad = graduationYear - academicYear;

  if (yearsUntilGrad <= 0) return "Graduate";
  if (yearsUntilGrad === 1) return "Fourth Year+";
  if (yearsUntilGrad === 2) return "Third Year";
  if (yearsUntilGrad === 3) return "Second Year";
  if (yearsUntilGrad >= 4) return "First Year";

  return undefined;
}

/**
 * Helper to parse selected contribution roles into a comma-separated display string
 *
 * @param contributionRole - object with boolean flags for each role the user selected
 * @returns comma-separated role names (e.g. "Developer, Designer"); undefined if no roles selected
 */
function getRoleDisplayNames(
  contributionRole?: ApplicantContribution,
): string | undefined {
  if (!contributionRole) return undefined;

  const roleMap: Record<keyof ApplicantContribution, string> = {
    developer: "Developer",
    designer: "Designer",
    productManager: "Product Manager",
    other: "Other",
  };

  const roles = Object.entries(contributionRole)
    .filter(([_, selected]) => selected === true)
    .map(([key]) => roleMap[key as keyof ApplicantContribution] || key);

  return roles.length > 0 ? roles.join(", ") : undefined;
}

/**
 * Fetches a social profile document for a given user
 *
 * @param uid - firebase auth user id (also used as the document id)
 * @returns the social profile if found; else null
 */
export async function fetchSocial(uid: string): Promise<Social | null> {
  const ref = getSocialRef(uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return null;
  }

  return snap.data() as Social;
}

/**
 * Fetches an existing social profile or creates a new one
 * Social profiles are global and shared across all hackathons
 * When creating for the first time, pre-populates from current application data if available
 *
 * @param uid - firebase auth user id (also used as the document id)
 * @param email - user's email address
 * @param applicant - applicant data to populate the social profile (optional)
 * @returns the social profile
 */
export async function fetchOrCreateSocial(
  uid: string,
  email: string,
  applicant?: Applicant | null,
): Promise<Social> {
  const existing = await fetchSocial(uid);

  if (existing) {
    return existing;
  }

  const newSocial: Social = {
    _id: uid,
    email,
    preferredName: applicant?.basicInfo?.preferredName,
    profilePictureIndex: 0,
    school: applicant?.basicInfo?.school,
    areaOfStudy: getMajorDisplayName(applicant?.basicInfo?.major),
    year: getYearLevel(applicant?.basicInfo?.graduation),
    role: getRoleDisplayNames(applicant?.skills?.contributionRole),
    socialLinks: {
      linkedin: applicant?.skills?.linkedin,
      github: applicant?.skills?.github,
      website: applicant?.skills?.portfolio,
    },
  };

  await createOrMergeSocial(uid, email, newSocial);

  return newSocial;
}

/**
 * Recursively removes all undefined fields from an object
 * Ensures clean data is sent to firestore as setDoc() doesn't accept undefined values
 *
 * @param obj - object to clean
 * @returns new object with undefined fields removed
 */
function removeUndefinedFields<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const cleanedNested = removeUndefinedFields(value as Record<string, unknown>);
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } else {
        cleaned[key] = value;
      }
    }
  }

  return cleaned as Partial<T>;
}

/**
 * Creates or merges a social profile 'draft' into Firestore
 *
 * @param uid - firebase auth user id
 * @param email - user's email address
 * @param draft - social profile to be merged
 * @returns a promise that resolves when the social profile is merged
 */
export async function createOrMergeSocial(
  uid: string,
  email: string,
  draft: SocialDraft,
): Promise<void> {
  const ref = getSocialRef(uid);

  const payload = {
    ...draft,
    _id: uid,
    email,
  };

  const cleanedPayload = removeUndefinedFields(payload);

  await setDoc(ref, cleanedPayload, { merge: true });
}
