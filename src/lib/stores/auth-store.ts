import { type User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { create } from "zustand";
import { checkAdminClaim, googleProvider } from "../firebase/auth";
import { auth } from "../firebase/client";
import { useHackerStore } from "./hacker-store";

type AuthStore = {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;

  initAuthListener: () => void;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  loading: true,
  error: null,

  initAuthListener: () => {
    onAuthStateChanged(auth, async (user) => {
      const previousUid = get().user?.uid;
      if (!user || (previousUid && user.uid !== previousUid)) {
        useHackerStore.getState().reset();
      }

      try {
        const isAdmin = user ? await checkAdminClaim(user) : false;
        set({
          user,
          isAuthenticated: !!user,
          isAdmin,
        });
      } catch (_) {
        set({
          user,
          isAuthenticated: !!user,
          isAdmin: false,
        });
      } finally {
        set({ loading: false });
      }
    });
  },

  signInWithGoogle: async () => {
    try {
      set({ loading: true, error: null });
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Sign in failed",
      });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    try {
      set({ loading: true, error: null });
      await signOut(auth);
      useHackerStore.getState().reset();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Logout failed",
      });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
