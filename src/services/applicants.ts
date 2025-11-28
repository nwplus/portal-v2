import { db } from "@/lib/firebase/client";
import { storage } from "@/lib/firebase/client";
import type { Applicant, ApplicantDraft } from "@/lib/firebase/types/applicants";
import {
  type DocumentData,
  type DocumentReference,
  type Timestamp,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

/**
 * Utility to get a typed reference to the applicant document for a given hackathon and user
 * Path: `Hackathons/{dbCollectionName}/Applicants/{uid}`
 *
 * @param dbCollectionName - firestore collection name for the hackathon
 * @param uid - firebase auth user id (also used as the document id)
 * @returns firestore document reference to the applicant's doc
 */
function getApplicantRef(dbCollectionName: string, uid: string): DocumentReference<DocumentData> {
  return doc(db, "Hackathons", dbCollectionName, "Applicants", uid);
}

/**
 * Fetches an applicant document
 *
 * @param dbCollectionName - firestore collection name for the hackathon
 * @param uid - firebase auth user id (also used as the document id)
 * @returns the applicant if found; else null
 */
export async function fetchApplicant(
  dbCollectionName: string,
  uid: string,
): Promise<Applicant | null> {
  const ref = getApplicantRef(dbCollectionName, uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return null;
  }

  return snap.data() as Applicant;
}

/**
 * Creates or merges an applicant draft into Firestore with server-side timestamping
 * Ensures `_id = uid` and updates `submission.lastUpdated = serverTimestamp()`
 *
 * @param dbCollectionName - firestore collection name for the hackathon
 * @param uid - firebase auth user id (also used as the document id)
 * @param draft - applicant draft to be merged
 * @returns a promise that resolves when the applicant draft is merged
 */
export async function createOrMergeApplicant(
  dbCollectionName: string,
  uid: string,
  draft: ApplicantDraft,
): Promise<void> {
  const ref = getApplicantRef(dbCollectionName, uid);

  // prepare a normalized submission patch
  type Submission = NonNullable<Applicant["submission"]>;
  const fromDraft = (draft.submission ?? {}) as Partial<Submission>;
  const { submitted: _omitSubmitted, ...submissionRest } = fromDraft;
  const mergedSubmission: Submission = {
    ...(submissionRest as Partial<Submission>),
    submitted: fromDraft.submitted ?? false,
    lastUpdated: serverTimestamp() as unknown as Submission["lastUpdated"],
  };

  // build the final payload
  const { _id: _omitId, submission: _omitSubmission, ...rest } = draft;
  const payload = { ...rest, _id: uid, submission: mergedSubmission };

  // TODO: validation
  // merge + write to firestore
  await setDoc(ref, payload, { merge: true });
}

/**
 * Submits an applicant draft by marking it as submitted and persisting it.
 * Returns the updated draft shape that callers can use to update local state.
 */
export async function submitApplicantDraft(
  dbCollectionName: string,
  uid: string,
  draft: ApplicantDraft,
): Promise<ApplicantDraft> {
  const submittedDraft: ApplicantDraft = {
    ...draft,
    submission: {
      ...(draft.submission ?? { submitted: false }),
      submitted: true,
      submittedAt: serverTimestamp() as Timestamp,
    },
    status: {
      applicationStatus: "applied",
    },
  };

  await createOrMergeApplicant(dbCollectionName, uid, submittedDraft);

  // TODO: send email to applicant

  return submittedDraft;
}

/**
 * Uploads a resume file to Firebase Storage and returns the public download URL.
 *
 * Files are stored under `applicantResumes/{userId}` to match existing
 * Storage rules and legacy behaviour from the previous portal.
 */
export async function uploadResumeToStorage(userId: string, file: File): Promise<string | null> {
  try {
    // Match the original v8-style path: storage.ref(`applicantResumes/${userId}`)
    const objectRef = ref(storage, `applicantResumes/${userId}`);
    const snapshot = await uploadBytes(objectRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return url;
  } catch (error) {
    console.error("Failed to upload resume", error);
    return null;
  }
}
