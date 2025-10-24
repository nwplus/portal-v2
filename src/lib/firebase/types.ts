// aligns with https://github.com/nwplus/admin-v2/blob/dev/src/lib/firebase/types.ts

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

export type ApplicationStatus =
  | "inProgress"
  | "applied"
  | "gradinginprog"
  | "waitlisted"
  | "scored"
  | "rejected"
  | "completed"
  | "acceptedNoResponseYet"
  | "acceptedAndAttending"
  | "acceptedUnRSVP";

export interface Hackathon {
  _id: string;
  featureFlags?: {
    isOpen?: boolean;
    registrationOpen?: boolean;
    test?: boolean;
  };
}
