import {
  CmdFIcon,
  HackCampIcon,
  NwHacksColouredIcon,
  NwHacksIcon,
  NwHacksSidebarIcon,
} from "@/components/icons";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Applicant } from "./firebase/types/applicants";
import { useAuthStore } from "./stores/auth-store";
import { usePortalStore } from "./stores/portal-store";
import type { DeepPartial } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Wait for auth to finish loading so route guards see a definite auth state on first load/refresh
 * This intentionally blocks navigation while sign-in/out flows are in progress
 *
 * If `loading` is already false, resolve immediately.
 * Otherwise:
 *   - Subscribe to `loading` changes
 *   - Immediately re-check after subscribing to avoid missed-event races
 * Any completion path calls `cleanup` to clear the timeout, unsubscribe, and resolve
 *
 * @returns a promise that resolves when auth is ready or the timeout elapses
 */
export const loadAuth = (): Promise<void> => {
  if (!useAuthStore.getState().loading) return Promise.resolve();

  return new Promise<void>((resolve) => {
    let unsub: () => void = () => {};
    const cleanup = () => {
      clearTimeout(timer);
      unsub();
      resolve();
    };

    // safety net of 60 seconds to avoid hanging forever
    const timer = setTimeout(cleanup, 60_000);

    unsub = useAuthStore.subscribe((state) => {
      if (!state.loading) cleanup();
    });

    if (!useAuthStore.getState().loading) cleanup();
  });
};

// same as loadAuth
export const loadPortalStore = (): Promise<void> => {
  if (!usePortalStore.getState().loading) return Promise.resolve();

  return new Promise<void>((resolve) => {
    let unsub: () => void = () => {};
    const cleanup = () => {
      clearTimeout(timer);
      unsub();
      resolve();
    };

    const timer = setTimeout(cleanup, 60_000);

    unsub = usePortalStore.subscribe((state) => {
      if (!state.loading) cleanup();
    });

    if (!usePortalStore.getState().loading) cleanup();
  });
};

/**
 * Type guard for plain objects (not arrays, null, Date, Map, etc.)
 *
 * @param value - value to check
 * @returns whether or not the value is a plain object
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (Object.prototype.toString.call(value) !== "[object Object]") {
    return false;
  }

  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

/**
 * Deep-merges a partial patch into a base object
 * - recursively merges plain objects
 * - replaces arrays and non-object values (no element-wise merge)
 * - skips `undefined` values in the patch to avoid accidental overwrites and Firestore errors
 * - if either side is not a plain object, returns `patch` (or `base` when `patch` is null/undefined)
 *
 * @param base - current object to update (e.g., existing applicant draft)
 * @param patch - deep-partial changes to apply
 * @returns merged copy of `base` with `patch` applied
 */
export function deepMerge<T>(base: T, patch: DeepPartial<T>): T {
  if (!isPlainObject(base) || !isPlainObject(patch)) {
    return (patch as unknown as T) ?? base;
  }
  const output: Record<string, unknown> = {
    ...(base as unknown as Record<string, unknown>),
  };
  for (const [key, value] of Object.entries(patch as unknown as Record<string, unknown>)) {
    if (value === undefined) {
      continue; // avoid overwriting with undefined (Firestore rejects undefined)
    }

    const current = output[key];
    if (isPlainObject(value) && isPlainObject(current)) {
      output[key] = deepMerge(current, value as DeepPartial<unknown>) as unknown;
    } else {
      output[key] = value;
    }
  }
  return output as unknown as T;
}

export const getHackathonIcon = (hackathonId: string): React.ComponentType => {
  const lowerName = hackathonId.toLowerCase();
  if (lowerName.includes("nwhacks")) return NwHacksIcon;
  if (lowerName.includes("cmd-f")) return CmdFIcon;
  if (lowerName.includes("hackcamp")) return HackCampIcon;
  return NwHacksIcon;
};

export const getSidebarHackathonIcon = (hackathonId: string): React.ComponentType => {
  const lowerName = hackathonId.toLowerCase();
  if (lowerName.includes("nwhacks")) return NwHacksSidebarIcon;
  if (lowerName.includes("cmd-f")) return CmdFIcon; // TODO: replace during reskin
  if (lowerName.includes("hackcamp")) return HackCampIcon; // TODO: replace during reskin
  return NwHacksIcon;
};

export const getColouredHackathonIcon = (hackathonId: string): React.ComponentType => {
  const lowerName = hackathonId.toLowerCase();
  if (lowerName.includes("nwhacks")) return NwHacksColouredIcon;
  if (lowerName.includes("cmd-f")) return CmdFIcon; // TODO: replace during reskin
  if (lowerName.includes("hackcamp")) return HackCampIcon; // TODO: replace during reskin
  return NwHacksIcon;
};

export const getPreferredName = (applicant: Applicant): string => {
  return applicant.basicInfo?.preferredName || applicant.basicInfo.legalFirstName;
};

export const getFullName = (applicant: Applicant): string => {
  const firstName = applicant.basicInfo?.preferredName || applicant.basicInfo.legalFirstName;
  const lastName = applicant.basicInfo.legalLastName;
  return `${firstName} ${lastName}`.trim();
};
