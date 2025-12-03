import { useApplicationQuestionStore } from "@/lib/stores/application-question-store";
import { subscribeToHackerAppQuestions } from "@/services/hacker-app-questions";
import { useEffect } from "react";

/**
 * Subscribes to live hacker application questions for a given hackathon and
 * hydrates the application question store
 *
 * @param displayNameShort - hackathon name used in firebase (e.g. `nwHacks`)
 */
export function useApplicationQuestions(displayNameShort: string) {
  useEffect(() => {
    const { reset } = useApplicationQuestionStore.getState();
    const unsubscribe = subscribeToHackerAppQuestions(displayNameShort, (questions) => {
      useApplicationQuestionStore.setState({
        welcome: questions.Welcome?.[0] ?? null,
        basicInfoQuestions: questions.BasicInfo ?? [],
        skillsQuestions: questions.Skills ?? [],
        questionnaireQuestions: questions.Questionnaire ?? [],
      });
    });

    return () => {
      unsubscribe();
      reset();
    };
  }, [displayNameShort]);
}
