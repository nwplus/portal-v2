import type { Timestamp } from "firebase/firestore";

/**
 * Filter criteria for determining stamp unlock eligibility
 * Based on admin portal filtering logic
 */
export interface StampCriteria {
  id: string;
  filterColumn: string; // e.g., "dayOf.checkedIn", "status.applicationStatus"
  filterCondition: "equals" | "not-equals" | "contains" | "greater-than" | "less-than";
  filterValue: string;
  logicalOperator: "AND" | "OR";
}

/**
 * Collection: /Stamps
 * Represents a stamp that hackers can collect during our hackathons
 */
export interface Stamp {
  _id: string;
  name: string;
  description: string;
  imgName: string;
  imgURL: string;
  lockedImgURL?: string;
  hackathon?: string; // optional: if hackathon-specific
  criteria?: StampCriteria[]; // optional: for portal-based stamps
  isHidden: boolean; // whether to hide if locked
  isQRUnlockable?: boolean; // whether this stamp has a QR associated with it ie. sponsor/judging-unlockable stamps
  isEventUnlockable?: boolean;
  isTitle?: boolean; // whether this stamp should be displayed on the title page (only one at a time)
  points?: number; // raffle entries this stamp is worth; read it through stampPointValue (missing counts as 1)
  lastModified?: Timestamp;
  lastModifiedBy: string;
}

/**
 * Extended stamp with computed unlock state for display
 */
export interface StampWithUnlockState extends Stamp {
  isUnlocked: boolean;
  pointValue?: number; // set on the current stampbook only; past stampbooks don't show points
}
