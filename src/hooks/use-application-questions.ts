import { useApplicationQuestionStore } from "@/lib/stores/application-question-store";
import { subscribeToHackerAppQuestions } from "@/services/applications";
import { useEffect } from "react";

/**
 * Subscribes to live hacker application questions for a given hackathon and
 * hydrates the application question store
 *
 * @param displayNameShort - hackathon name used in Firestore paths (e.g. `nwHacks`).
 */
export function useApplicationQuestions(displayNameShort: string) {
  useEffect(() => {
    const {
      setWelcome,
      setBasicInfoQuestions,
      setSkillsQuestions,
      setQuestionnaireQuestions,
      reset,
    } = useApplicationQuestionStore.getState();
    const unsubscribe = subscribeToHackerAppQuestions(displayNameShort, (questions) => {
      setWelcome(questions.Welcome?.[0] ?? null);
      setBasicInfoQuestions(questions.BasicInfo ?? []);
      setSkillsQuestions(questions.Skills ?? []);
      setQuestionnaireQuestions(questions.Questionnaire ?? []);
    });

    return () => {
      unsubscribe();
      reset();
    };
  }, [displayNameShort]);
}
