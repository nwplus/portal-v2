import { db } from "@/lib/firebase/client";
import type {
  HackerApplicationQuestion,
  HackerApplicationQuestionMap,
  HackerApplicationSections,
} from "@/lib/firebase/types/hacker-app-questions";
import { type Unsubscribe, collection, onSnapshot, query } from "firebase/firestore";

/**
 * Utility function that subscribes to all questions for a given hackathon
 *
 * @param displayNameShort - the hackathon to query (e.g. "nwHacks" - that's just how they're stored)
 * @param callback - callback function to ingest the data
 * @returns a unsubscribe function to be called on dismount
 */
export function subscribeToHackerAppQuestions(
  displayNameShort: string,
  callback: (data: HackerApplicationQuestionMap) => void,
): Unsubscribe {
  const sections: HackerApplicationSections[] = ["BasicInfo", "Questionnaire", "Skills", "Welcome"];
  const buckets: HackerApplicationQuestionMap = {
    BasicInfo: [],
    Questionnaire: [],
    Skills: [],
    Welcome: [],
  };
  const unsubscribers: Unsubscribe[] = [];
  const loadedSections = new Set<string>();

  for (const section of sections) {
    const sectionCollection = collection(db, "HackerAppQuestions", displayNameShort, section);
    const sectionQuery = query(sectionCollection);

    const unsubscribe = onSnapshot(sectionQuery, (snap) => {
      const docs = snap.docs
        .map((d) => ({
          ...(d.data() as HackerApplicationQuestion),
          _id: `${section}-${d.id}`,
        }))
        .sort((a, b) => (a._id ?? "").localeCompare(b._id ?? ""));

      if (section === "Welcome") {
        buckets.Welcome = docs as HackerApplicationQuestionMap["Welcome"];
      } else {
        buckets[section] = docs as HackerApplicationQuestionMap[Exclude<
          HackerApplicationSections,
          "Welcome"
        >];
      }

      loadedSections.add(section);
      if (loadedSections.size === sections.length) {
        callback({ ...buckets });
      }
    });
    unsubscribers.push(unsubscribe);
  }

  return () => {
    for (const unsubscriber of unsubscribers) {
      unsubscriber();
    }
  };
}
