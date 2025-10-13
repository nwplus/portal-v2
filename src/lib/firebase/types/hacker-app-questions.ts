import type { Timestamp } from "firebase/firestore";

/**
 *  Collection: /HackerAppQuestions
 *
 *  Hacker app
 */
export type HackerApplicationQuestionMap = Record<
  HackerApplicationSections,
  HackerApplicationQuestion[]
>;

export type HackerApplicationSections = "BasicInfo" | "Questionnaire" | "Skills" | "Welcome";

export type HackerApplicationQuestionType =
  | "Long Answer"
  | "Portfolio"
  | "Select All"
  | "Multiple Choice" // single selection
  | "Full Legal Name"
  | "Short Answer"
  | "Dropdown"
  | "School"
  | "Major"
  | "Country";

export type HackerApplicationQuestionFormInputField =
  | "academicYear"
  | "ageByHackathon"
  | "canadianStatus"
  | "culturalBackground"
  | "dietaryRestriction"
  | "disability"
  | "educationLevel"
  | "email"
  | "gender"
  | "graduation"
  | "haveTransExperience"
  | "identifyAsUnderrepresented"
  | "indigenousIdentification"
  | "phoneNumber"
  | "preferredName"
  | "pronouns"
  | "race"
  | "jobPosition";

export interface HackerApplicationQuestion {
  _id?: string; // internal
  title?: string;
  content?: string; // only for welcome message
  description?: string; // q description
  formInput?: HackerApplicationQuestionFormInputField; // name of input's value
  options?: string[]; // for select and multiselect
  other?: boolean; // for 'other' responses
  required?: boolean;
  type?: HackerApplicationQuestionType;
  maxWords?: string; // for answers
}

export type HackerApplicationMetadataInfo = {
  lastEditedAt: Timestamp;
  lastEditedBy: string;
};

export type HackerApplicationMetadata = Record<
  HackerApplicationSections,
  HackerApplicationMetadataInfo
>;
