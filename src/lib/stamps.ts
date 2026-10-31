import type { Stamp } from "@/lib/firebase/types/stamps";

/**
 * admin-v2 only generates `?unlockStamp=` QR codes for stamps marked QR-unlockable, so any
 * other stamp (CTF, check-in, criteria) must not be unlockable from a URL
 */
export function canUnlockFromUrl(stamp: Pick<Stamp, "isQRUnlockable">): boolean {
  return stamp.isQRUnlockable === true;
}
