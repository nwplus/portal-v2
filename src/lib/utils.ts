import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAuthStore } from "./stores/auth-store";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Utility that waits for auth state to finish loading before proceeding.
 * @returns a promise that resolves when auth is finished loading
 */
export const loadAuth = () => {
  const { loading } = useAuthStore.getState();
  if (!loading) {
    return;
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      resolve(undefined);
    }, 15000);

    const unsubscribe = useAuthStore.subscribe((state) => {
      if (!state.loading) {
        clearTimeout(timeout);
        unsubscribe();
        resolve(undefined);
      }
    });
  });
};
