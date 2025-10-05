import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAuthStore } from "./stores/auth-store";

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
