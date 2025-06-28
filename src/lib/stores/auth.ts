import {
  GoogleAuthProvider,
  type User,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { create } from "zustand";
import { app } from "../firebase";

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

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

const checkAdminClaim = async (user: User): Promise<boolean> => {
  const token = await user.getIdTokenResult();
  return Object.prototype.hasOwnProperty.call(token.claims, "admin");
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  loading: true,
  error: null,

  initAuthListener: () => {
    onAuthStateChanged(auth, async (user) => {
      const isAdmin = user ? await checkAdminClaim(user) : false;
      set({
        user,
        isAuthenticated: !!user,
        isAdmin,
        loading: false,
      });
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
