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
