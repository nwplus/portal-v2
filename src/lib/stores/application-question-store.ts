import type { HackerApplicationQuestion } from "@/lib/firebase/types/hacker-app-questions";
import { create } from "zustand";

type ApplicationQuestionStore = {
  welcome: HackerApplicationQuestion | null; // since there will only be one welcome question
  basicInfoQuestions: HackerApplicationQuestion[];
  skillsQuestions: HackerApplicationQuestion[];
  questionnaireQuestions: HackerApplicationQuestion[];

  setWelcome: (welcome: HackerApplicationQuestion | null) => void;
  setBasicInfoQuestions: (questions: HackerApplicationQuestion[]) => void;
  setSkillsQuestions: (questions: HackerApplicationQuestion[]) => void;
  setQuestionnaireQuestions: (questions: HackerApplicationQuestion[]) => void;

  reset: () => void;
};

export const useApplicationQuestionStore = create<ApplicationQuestionStore>((set) => ({
  welcome: null,
  basicInfoQuestions: [],
  skillsQuestions: [],
  questionnaireQuestions: [],

  setWelcome: (welcome: HackerApplicationQuestion | null) => set({ welcome }),
  setBasicInfoQuestions: (questions: HackerApplicationQuestion[]) =>
    set({ basicInfoQuestions: questions }),
  setSkillsQuestions: (questions: HackerApplicationQuestion[]) =>
    set({ skillsQuestions: questions }),
  setQuestionnaireQuestions: (questions: HackerApplicationQuestion[]) =>
    set({ questionnaireQuestions: questions }),

  reset: () =>
    set({
      welcome: null,
      basicInfoQuestions: [],
      skillsQuestions: [],
      questionnaireQuestions: [],
    }),
}));
