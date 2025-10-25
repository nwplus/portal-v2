import { z } from "zod";
import type { ApplicantDraft } from "./firebase/types/applicants";

// used for URL routing validation
export const VALID_HACKATHONS = z.enum(["hackcamp", "nwhacks", "cmd-f"]);

// template used when creating the initial applicant document
export const HACKER_APPLICATION_TEMPLATE: ApplicantDraft = {
  _id: "",
  status: { applicationStatus: "inProgress" },
  submission: { submitted: false },
};
