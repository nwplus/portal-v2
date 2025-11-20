import type { Timestamp } from "firebase/firestore";

/**
 *  Collection: /HackerAppQuestions
 *
 *  Hacker app
 */
export type HackerApplicationSections = "BasicInfo" | "Questionnaire" | "Skills" | "Welcome";
export type HackerApplicationQuestionType =
  | "Long Answer" // dynamic
  | "Portfolio" // fixed
  | "Select All" // dynamic
  | "Multiple Choice" // dynamic, single selection
  | "Full Legal Name" // fixed
  | "Short Answer" // dynamic
  | "Dropdown" // dynamic
  | "School" // fixed
  | "Major" // fixed
  | "Country"; // fixed
export type HackerApplicationQuestionFormInputField =
  | "academicYear"
  | "ageByHackathon"
  | "canadianStatus"
  | "countryOfResidence"
  | "culturalBackground"
  | "dietaryRestriction"
  | "disability"
  | "educationLevel"
  | "email"
  | "legalFirstName"
  | "legalLastName"
  | "isOfLegalAge"
  | "gender"
  | "graduation"
  | "haveTransExperience"
  | "identifyAsUnderrepresented"
  | "indigenousIdentification"
  | "phoneNumber"
  | "preferredName"
  | "pronouns"
  | "race"
  | "jobPosition"
  | "connectPlus"
  | "school"
  | "major"
  | "github"
  | "linkedin"
  | "portfolio"
  | "resume"
  | "numHackathonsAttended"
  | "contributionRole"
  | "longAnswers1"
  | "longAnswers2"
  | "longAnswers3"
  | "longAnswers4"
  | "longAnswers5"
  | "engagementSource"
  | "eventsAttended"
  | "friendEmail"
  | "otherEngagementSource";
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
  maxWords?: string; // for long answers
}

export type HackerApplicationMetadataInfo = {
  lastEditedAt: Timestamp;
  lastEditedBy: string;
};

export type HackerApplicationMetadata = Record<
  HackerApplicationSections,
  HackerApplicationMetadataInfo
>;

export type HackerApplicationQuestionMap = {
  BasicInfo: HackerApplicationQuestion[];
  Questionnaire: HackerApplicationQuestion[];
  Skills: HackerApplicationQuestion[];
  Welcome: HackerApplicationQuestion[];
};
