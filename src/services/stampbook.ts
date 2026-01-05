import { db } from "@/lib/firebase/client";
import type { Applicant } from "@/lib/firebase/types/applicants";
import type { Stamp, StampCriteria, StampWithUnlockState } from "@/lib/firebase/types/stamps";
import { fetchApplicant } from "@/services/applicants";
import { arrayUnion, collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";

/**
 * Load stampbook with computed unlock states
 * Called on stampbook page load
 */
export async function loadStampbook(
  uid: string,
  dbCollectionName: string,
): Promise<StampWithUnlockState[]> {
  const [allStamps, unlockedStamps, hacker] = await Promise.all([
    fetchStamps(dbCollectionName),
    fetchUnlockedStampIds(uid),
    fetchApplicant(dbCollectionName, uid),
  ]);

  console.log("allStamps", allStamps);
  console.log("unlockedStamps", unlockedStamps);

  return allStamps
    .filter((s: Stamp) => !s.isHidden || unlockedStamps.has(s._id))
    .map((stamp: Stamp) => {
      // previosuly unlocked through QR or check-in app
      if (unlockedStamps.has(stamp._id)) {
        return { ...stamp, isUnlocked: true };
      }

      // otherwise, evaluate portal-based criteria
      if (stamp.criteria && hacker) {
        const shouldUnlock = evaluateUnlockCriteria(stamp.criteria, hacker);

        if (shouldUnlock) {
          persistUnlockedStamp(uid, stamp._id);
        }

        return { ...stamp, isUnlocked: shouldUnlock };
      }

      return { ...stamp, isUnlocked: false };
    });
}

/**
 * Persist a newly-unlocked stamp to the user's social profile.
 */
async function persistUnlockedStamp(uid: string, stampId: string): Promise<void> {
  const socialRef = doc(db, "Socials", uid);
  await setDoc(
    socialRef,
    {
      unlockedStamps: arrayUnion(stampId),
    },
    { merge: true },
  );
}

/**
 * Utility to fetch all valid stamps.
 *
 * @param hackathonId - the hackathon ID to (optionally) filter stamps by
 * @returns a list of stamps
 */
export async function fetchStamps(hackathonId?: string): Promise<Stamp[]> {
  const ref = collection(db, "Stamps");
  const querySnapshot = await getDocs(ref);

  console.log("current hackathon", hackathonId);

  return querySnapshot.docs
    .map(
      (doc) =>
        ({
          _id: doc.id,
          ...doc.data(),
        }) as Stamp,
    )
    .filter(
      (stamp) => !stamp.hackathon || stamp.hackathon.toLowerCase() === hackathonId?.toLowerCase(),
    );
}

/**
 * Utility to fetch user's already unlocked stamp (IDs)
 */
export async function fetchUnlockedStampIds(uid: string): Promise<Set<string>> {
  const ref = doc(db, "Socials", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return new Set();

  const data = snap.data();
  return new Set(data.unlockedStamps ?? []);
}

/**
 * Evaluate if a stamp's criteria is satisifed by hacker data
 */
export function evaluateUnlockCriteria(criterion: StampCriteria[], hacker: Applicant): boolean {
  if (!criterion || criterion.length === 0) return false;

  let result = true;

  for (const criteria of criterion) {
    const fieldValue = getNestedValue(hacker, criteria.filterColumn);
    const conditionMet = checkCondition(fieldValue, criteria.filterCondition, criteria.filterValue);

    if (criteria.logicalOperator === "AND") {
      result = result && conditionMet;
    } else {
      result = result || conditionMet;
    }
  }

  return result;
}

/**
 * Retrieve nested field values like dayOf.checkedIn, status.applicationStatus, etc.
 */
function getNestedValue(obj: object, path: string): unknown {
  let current: unknown = obj;
  for (const key of path.split(".")) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/**
 * Helper to evaluate a single condition
 */
function checkCondition(
  actual: unknown,
  condition: StampCriteria["filterCondition"],
  expected: string,
): boolean {
  const actualStr = String(actual);

  switch (condition) {
    case "equals":
      return actualStr === expected;
    case "not-equals":
      return actualStr !== expected;
    case "contains":
      return actualStr.includes(expected);
    case "greater-than":
      return Number(actual) > Number(expected);
    case "less-than":
      return Number(actual) < Number(expected);
    default:
      return false;
  }
}
