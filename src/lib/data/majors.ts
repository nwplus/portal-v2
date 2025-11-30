import type { ApplicantMajor } from "@/lib/firebase/types/applicants";

export const MAJOR_OPTIONS: Readonly<Record<ApplicantMajor, string>> = Object.freeze({
  computerScience: "Computer science, computer engineering, or software engineering",
  otherEngineering: "Another engineering discipline (such as civil, electrical, mechanical, etc.)",
  informationTech: "Information systems, information technology, or system administration",
  naturalScience: "A natural science (such as biology, chemistry, physics, etc.)",
  mathOrStats: "Mathematics or statistics",
  webDevOrDesign: "Web development or web design",
  business: "Business discipline (such as accounting, finance, marketing, etc.)",
  humanities: "Humanities discipline (such as literature, history, philosophy, etc.)",
  socialScience: "Social science (such as anthropology, psychology, political science, etc.)",
  arts: "Fine arts or performing arts (such as graphic design, music, studio art, etc.)",
  healthScience: "Health science (such as nursing, pharmacy, radiology, etc.)",
  undecidedOrUndeclared: "Undecided / No Declared Major",
  schoolDoesNotOfferMajors: "My school does not offer majors / primary areas of study",
  other: "Other (Please Specify)",
  preferNotToAnswer: "Prefer not to answer",
});

export const MAJOR_KEYS: readonly ApplicantMajor[] = Object.freeze(
  Object.keys(MAJOR_OPTIONS) as ApplicantMajor[],
);
