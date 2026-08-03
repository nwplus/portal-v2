import { functions } from "@/lib/firebase/client";
import { httpsCallable } from "firebase/functions";

interface GenerateGoogleWalletPassInput {
  dbCollectionName: string;
  qrValue: string;
}

interface GenerateGoogleWalletPassOutput {
  success: boolean;
  saveUrl: string;
}

const generateGoogleWalletPass = httpsCallable<
  GenerateGoogleWalletPassInput,
  GenerateGoogleWalletPassOutput
>(functions, "generateGoogleWalletPass");

/**
 * Calls the `generateGoogleWalletPass` callable (Functions-new, `wallet/google`
 * branch) to upsert a Wallet class+object for the hacker, then returns the
 * signed `saveUrl` the browser should open to land on Google's "Save to Wallet" page.
 *
 * Mirrors the `qrValue` construction used by `components/features/my-ticket/ticket.tsx:52-54`:
 * `${origin}/${activeHackathon}/social-profile/${uid}`.
 */
export async function addHackerPassToGoogleWallet(
  dbCollectionName: string,
  qrValue: string,
): Promise<string> {
  const result = await generateGoogleWalletPass({ dbCollectionName, qrValue });
  return result.data.saveUrl;
}

interface GenerateAppleWalletPassInput {
  dbCollectionName: string;
  qrValue: string;
}

interface GenerateAppleWalletPassOutput {
  success: boolean;
  downloadUrl: string;
}

const generateAppleWalletPass = httpsCallable<
  GenerateAppleWalletPassInput,
  GenerateAppleWalletPassOutput
>(functions, "generateAppleWalletPass");

/**
 * Calls the `generateAppleWalletPass` callable (Functions-new, `wallet/apple`
 * branch) to build and sign a `.pkpass` for the hacker, then returns the
 * public Storage URL the browser should navigate to so iOS Safari downloads
 * the pass and opens the Wallet "Add Pass" sheet.
 *
 * Mirrors the `qrValue` construction used by `components/features/my-ticket/ticket.tsx:52-54`:
 * `${origin}/${activeHackathon}/social-profile/${uid}`.
 */
export async function addHackerPassToAppleWallet(
  dbCollectionName: string,
  qrValue: string,
): Promise<string> {
  const result = await generateAppleWalletPass({ dbCollectionName, qrValue });
  return result.data.downloadUrl;
}
