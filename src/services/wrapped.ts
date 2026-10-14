import { db } from "@/lib/firebase/client";
import type {
  WrappedDoc,
  WrappedShareCard,
  WrappedStatsSession,
} from "@/lib/firebase/types/wrapped";
import { type DocumentData, type DocumentReference, doc, getDoc, setDoc } from "firebase/firestore";

/**
 * Utility to get a typed reference to a hacker's Wrapped deck document
 * Path: `Hackathons/{dbCollectionName}/Wrapped/{uid}`
 *
 * Owner-read only — the whole deck is one denormalized document, so rendering it
 * costs a single read.
 *
 * @param dbCollectionName - firestore collection name for the hackathon
 * @param uid - firebase auth user id (also used as the document id)
 * @returns firestore document reference to the hacker's wrapped doc
 */
function getWrappedRef(dbCollectionName: string, uid: string): DocumentReference<DocumentData> {
  return doc(db, "Hackathons", dbCollectionName, "Wrapped", uid);
}

/**
 * Utility to get a typed reference to a public share card
 * Path: `WrappedShares/{shareId}`
 *
 * Top-level and world-readable, unlike every other per-hacker path in this app —
 * the card deliberately carries no uid, email or teammate data.
 *
 * @param shareId - hashed share id, from `WrappedDoc.shareId`
 * @returns firestore document reference to the public share card
 */
function getWrappedShareRef(shareId: string): DocumentReference<DocumentData> {
  return doc(db, "WrappedShares", shareId);
}

/**
 * Utility to get a typed reference to a hacker's Wrapped telemetry document
 * Path: `Hackathons/{dbCollectionName}/WrappedStats/{uid}`
 *
 * @param dbCollectionName - firestore collection name for the hackathon
 * @param uid - firebase auth user id (also used as the document id)
 * @returns firestore document reference to the hacker's telemetry doc
 */
function getWrappedStatsRef(
  dbCollectionName: string,
  uid: string,
): DocumentReference<DocumentData> {
  return doc(db, "Hackathons", dbCollectionName, "WrappedStats", uid);
}

/**
 * Reads the organizer release flag, `Hackathons/{dbCollectionName}.wrapped.isReady`
 *
 * @param dbCollectionName - firestore collection name for the hackathon
 * @returns true only when the flag is literally `true`; a missing doc or field is not released
 */
export async function fetchWrappedReady(dbCollectionName: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "Hackathons", dbCollectionName));
  return snap.get("wrapped.isReady") === true;
}

/**
 * Fetches a hacker's Wrapped deck
 *
 * @param dbCollectionName - firestore collection name for the hackathon
 * @param uid - firebase auth user id (also used as the document id)
 * @returns the wrapped doc if found; else null
 */
export async function fetchWrappedDoc(
  dbCollectionName: string,
  uid: string,
): Promise<WrappedDoc | null> {
  const ref = getWrappedRef(dbCollectionName, uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return null;
  }

  return snap.data() as WrappedDoc;
}

/**
 * Fetches a public share card
 *
 * @param shareId - hashed share id from the share URL
 * @returns the share card if found; else null
 */
export async function fetchWrappedShareCard(shareId: string): Promise<WrappedShareCard | null> {
  const ref = getWrappedShareRef(shareId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return null;
  }

  return snap.data() as WrappedShareCard;
}

/**
 * Records Wrapped telemetry for a hacker
 *
 * Merged rather than replaced, so `opened`, `completed` and `shareClicked` accumulate
 * across visits. A missing doc means "never opened" and counts toward the open-rate
 * denominator, so this is only ever called once the deck is actually on screen — never
 * to pre-create a doc.
 *
 * Telemetry failing is not a reason a hacker cannot see their deck, so this swallows
 * its errors rather than rejecting into the render path.
 *
 * @param dbCollectionName - firestore collection name for the hackathon
 * @param uid - firebase auth user id (also used as the document id)
 * @param patch - the session fields to merge
 */
export async function recordWrappedSession(
  dbCollectionName: string,
  uid: string,
  patch: Partial<WrappedStatsSession>,
): Promise<void> {
  try {
    await setDoc(getWrappedStatsRef(dbCollectionName, uid), patch, { merge: true });
  } catch (error) {
    console.error("Failed to record wrapped telemetry", error);
  }
}
