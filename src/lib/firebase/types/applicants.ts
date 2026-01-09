import type { DeepPartial } from "@/lib/types";
import type { Timestamp } from "firebase/firestore";

/**
 *  Sub-collection: /Hackathons/[Hackathon]/Applicants
 */

export interface Applicant {
  _id: string;
  basicInfo: {
    email: string;
    legalFirstName: string;
    legalLastName: string;
    academicYear?: string;
    ageByHackathon?: string;
    preferredName?: string; // preferred first name
    phoneNumber: string; // "+1 XXX-XXX-XXXX"
    gender: string | Record<string, boolean>;
    graduation: number;
    isOfLegalAge: boolean;
    countryOfResidence: string;
    educationLevel: ApplicantEducationLevel;
    otherEducationLevel?: string;
    major: ApplicantMajor | Record<string, boolean>;
    otherMajor?: string;
    school: string;
    canadianStatus?: string;
    culturalBackground?: {
      asian: boolean;
      black: boolean;
      caucasian: boolean;
      hispanic: boolean;
      middleEastern: boolean;
      nativeHawaiian: boolean;
      northAmerica: boolean;
      other: boolean;
      preferNot: boolean;
    };
    dietaryRestriction?: {
      celiacDisease: boolean;
      halal: boolean;
      kosher: boolean;
      none: boolean;
      other: boolean;
      vegan: boolean;
      vegetarian: boolean;
    };
    disability?: Record<string, boolean>;
    haveTransExperience?: boolean;
    identifyAsUnderrepresented?: boolean;
    indigenousIdentification?: boolean;
    pronouns?: Record<string, boolean>;
    otherPronouns?: string;
    race?: Record<string, boolean>;

    // RSVP fields
    willBeAttendingCheck?: boolean;
    releaseLiabilityCheck?: boolean;
    mediaConsentCheck?: boolean;
    safewalkCheck?: boolean;
    sponsorEmailConsentCheck?: boolean;
    marketingFeatureCheck?: boolean;
  };
  questionnaire: {
    engagementSource?: string | Record<string, boolean>;
    eventsAttended?: Record<string, boolean>;
    friendEmail?: string;
    otherEngagementSource?: string;
  };
  skills: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
    resume?: string;
    numHackathonsAttended?: number;
    contributionRole?: ApplicantContribution;
    longAnswers1?: string;
    longAnswers2?: string;
    longAnswers3?: string;
    longAnswers4?: string;
    longAnswers5?: string;
    jobPosition?: string;
    connectPlus?: boolean;
  };
  status: {
    applicationStatus: ApplicationStatus;
    attending?: boolean;
    responded?: boolean;
  };
  submission?: {
    lastUpdated?: Timestamp;
    submittedAt?: Timestamp; // new
    submitted: boolean;
  };
  termsAndConditions: {
    MLHCodeOfConduct?: boolean;
    MLHEmailSubscription?: boolean;
    MLHPrivacyPolicy?: boolean;
    nwPlusPrivacyPolicy: boolean;
    shareWithSponsors: boolean;
    shareWithnwPlus: boolean;
  };
}

export type ApplicantEducationLevel =
  | "Less than Secondary / High School"
  | "Secondary / High School"
  | "Undergraduate University (2 year - community college or similar)"
  | "Undergraduate University (3+ years)"
  | "Graduate University (Masters, Doctoral, Professional, etc.)"
  | "Code School / Bootcamp"
  | "Other Vocational / Trade Program or Apprenticeship"
  | "Post-Doctorate"
  | "I'm not currently a student"
  | "Prefer not to answer";

export type ApplicantMajor =
  | "computerScience"
  | "otherEngineering"
  | "informationTech"
  | "naturalScience"
  | "mathOrStats"
  | "webDevOrDesign"
  | "business"
  | "humanities"
  | "socialScience"
  | "arts"
  | "healthScience"
  | "other"
  | "undecidedOrUndeclared"
  | "schoolDoesNotOfferMajors"
  | "preferNotToAnswer";

export type ApplicantContributionRole = "developer" | "designer" | "productManager" | "other";
export type ApplicantContribution = Record<ApplicantContributionRole, boolean>;

export type ApplicationStatus =
  | "inProgress"
  | "applied"
  | "gradinginprog"
  | "waitlisted"
  | "pendingWaitlist"
  | "scored"
  | "rejected"
  | "completed"
  | "acceptedNoResponseYet"
  | "acceptedAndAttending"
  | "acceptedUnRSVP";

// Local working copy during editing/autosave (not from firebase)
export type ApplicantDraft = DeepPartial<Applicant> & {
  _id: string;
  status: { applicationStatus: ApplicationStatus } & DeepPartial<Applicant["status"]>;
  submission: { submitted: boolean } & DeepPartial<NonNullable<Applicant["submission"]>>;
};

/**
 * Extended applicant type for attending and checked-in hackers.
 */
export type Hacker = Applicant & {
  dayOf?: {
    day1?: {
      breakfast?: Timestamp[];
      lunch?: Timestamp[];
      dinner?: Timestamp[];
      snack?: Timestamp[];
    };
    day2?: {
      breakfast?: Timestamp[];
      lunch?: Timestamp[];
      dinner?: Timestamp[];
    };
    checkedIn?: boolean;
    events?: Array<{
      eventId: string;
      eventName: string;
      timestamp: Timestamp;
    }>;
  };
};
