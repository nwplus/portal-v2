import type {
  HackerApplicationNonWelcomeQuestion,
  HackerApplicationWelcomeQuestion,
} from "@/lib/firebase/types/hacker-app-questions";
import { create } from "zustand";

type ApplicationQuestionStore = {
  welcome: HackerApplicationWelcomeQuestion | null; // since there will only be one welcome question
  basicInfoQuestions: HackerApplicationNonWelcomeQuestion[];
  skillsQuestions: HackerApplicationNonWelcomeQuestion[];
  questionnaireQuestions: HackerApplicationNonWelcomeQuestion[];

  setWelcome: (welcome: HackerApplicationWelcomeQuestion | null) => void;
  setBasicInfoQuestions: (questions: HackerApplicationNonWelcomeQuestion[]) => void;
  setSkillsQuestions: (questions: HackerApplicationNonWelcomeQuestion[]) => void;
  setQuestionnaireQuestions: (questions: HackerApplicationNonWelcomeQuestion[]) => void;

  reset: () => void;
};

export const useApplicationQuestionStore = create<ApplicationQuestionStore>((set) => ({
  welcome: null,
  basicInfoQuestions: [],
  skillsQuestions: [],
  questionnaireQuestions: [],

  setWelcome: (welcome: HackerApplicationWelcomeQuestion | null) => set({ welcome }),
  setBasicInfoQuestions: (questions: HackerApplicationNonWelcomeQuestion[]) =>
    set({ basicInfoQuestions: questions }),
  setSkillsQuestions: (questions: HackerApplicationNonWelcomeQuestion[]) =>
    set({ skillsQuestions: questions }),
  setQuestionnaireQuestions: (questions: HackerApplicationNonWelcomeQuestion[]) =>
    set({ questionnaireQuestions: questions }),

  reset: () =>
    set({
      welcome: null,
      basicInfoQuestions: [],
      skillsQuestions: [],
      questionnaireQuestions: [],
    }),
}));
