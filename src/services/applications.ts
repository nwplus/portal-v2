import { db } from "@/lib/firebase/client";
import type {
  HackerApplicationQuestion,
  HackerApplicationQuestionMap,
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
  const sections = ["BasicInfo", "Questionnaire", "Skills", "Welcome"] as const;
  type Section = (typeof sections)[number];

  const buckets: HackerApplicationQuestionMap = {
    BasicInfo: [],
    Questionnaire: [],
    Skills: [],
    Welcome: [],
  };
  const loadedSections = new Set<Section>();
  const unsubscribers: Unsubscribe[] = [];

  for (const section of sections) {
    const sectionCollection = collection(db, "HackerAppQuestions", displayNameShort, section);
    const sectionQuery = query(sectionCollection);

    const unsubscribe = onSnapshot(sectionQuery, (snap) => {
      buckets[section] = snap.docs
        .map((d) => ({ _id: d.id, ...(d.data() as HackerApplicationQuestion) }))
        .sort((a, b) => (a._id < b._id ? -1 : a._id > b._id ? 1 : 0));
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
