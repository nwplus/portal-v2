import { GoogleAuthProvider, type User } from "firebase/auth";

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export const checkAdminClaim = async (user: User): Promise<boolean> => {
  const token = await user.getIdTokenResult();
  return Object.prototype.hasOwnProperty.call(token.claims, "admin");
};
