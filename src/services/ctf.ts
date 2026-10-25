import { db, functions } from "@/lib/firebase/client";
import type {
  CtfChallenge,
  CtfSolve,
  SubmitCtfFlagInput,
  SubmitCtfFlagResult,
} from "@/lib/firebase/types/ctf";
import {
  type FirestoreError,
  type Unsubscribe,
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

const submitCtfFlagCallable = httpsCallable<SubmitCtfFlagInput, SubmitCtfFlagResult>(
  functions,
  "submitCtfFlag",
);

/**
 * Live CTF challenges for a hackathon, so cards open and claimed counts move without a reload
 *
 * @param dbCollectionName - firestore collection name for the hackathon
 * @param callback - receives every challenge, unsorted
 * @param onError - called if the listener fails, e.g. permission denied
 * @returns an unsubscribe function to be called on dismount
 */
export function subscribeToCtfChallenges(
  dbCollectionName: string,
  callback: (challenges: CtfChallenge[]) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, "Hackathons", dbCollectionName, "CtfChallenges")),
    (snapshot) => {
      callback(
        snapshot.docs.map((d) => ({ ...(d.data() as Omit<CtfChallenge, "_id">), _id: d.id })),
      );
    },
    onError,
  );
}

/**
 * Live solves for the signed-in hacker; rules only allow reading your own
 *
 * @param dbCollectionName - firestore collection name for the hackathon
 * @param uid - the signed-in hacker's uid
 * @param callback - receives the hacker's solves
 * @param onError - called if the listener fails, e.g. permission denied
 * @returns an unsubscribe function to be called on dismount
 */
export function subscribeToOwnCtfSolves(
  dbCollectionName: string,
  uid: string,
  callback: (solves: CtfSolve[]) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, "Hackathons", dbCollectionName, "CtfSolves"), where("uid", "==", uid)),
    (snapshot) => {
      callback(snapshot.docs.map((d) => ({ ...(d.data() as Omit<CtfSolve, "_id">), _id: d.id })));
    },
    onError,
  );
}

/**
 * Calls the `submitCtfFlag` callable (Functions-new), which checks, claims and scores the flag
 * Expected outcomes come back as a result; throws only for auth, RSVP, rate-limit and server errors
 */
export async function submitCtfFlag(
  dbCollectionName: string,
  flag: string,
): Promise<SubmitCtfFlagResult> {
  const result = await submitCtfFlagCallable({ dbCollectionName, flag });
  return result.data;
}
