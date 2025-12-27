import { db } from "@/lib/firebase/client";
import type { FAQ } from "@/lib/firebase/types";
import { collection, getDocs, query, where } from "firebase/firestore";

/**
 * Utility to get all FAQs, filtered by docs whose `hackathonIDs` array
 * contains hackathonId
 *
 * @param hackathonId - the hackathon ID to filter FAQs by
 * @returns a list of FAQs whose hackathonIDs array contains the hackathonId
 */
export async function fetchFaqs(hackathonId: string): Promise<(FAQ & { _id: string })[]> {
  const ref = collection(db, "FAQ");
  const q = query(ref, where("hackathonIDs", "array-contains", hackathonId));

  const querySnapshot = await getDocs(q);
  const faqs: (FAQ & { _id: string })[] = [];

  for (const doc of querySnapshot.docs) {
    const data = doc.data();
    faqs.push({
      _id: doc.id,
      hackathonIDs: data.hackathonIDs ?? [],
      ...data,
    });
  }

  return faqs;
}
