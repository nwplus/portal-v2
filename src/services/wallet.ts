import { functions } from "@/lib/firebase/client";
import { httpsCallable } from "firebase/functions";

interface GenerateGoogleWalletPassInput {
  dbCollectionName: string;
  qrValue: string;
}

interface GenerateGoogleWalletPassOutput {
  success: boolean;
  saveUrl: string;
  assetsMissing?: boolean;
  missingAssets?: string[];
}

const generateGoogleWalletPass = httpsCallable<
  GenerateGoogleWalletPassInput,
  GenerateGoogleWalletPassOutput
>(functions, "generateGoogleWalletPass");

/**
 * Calls the `generateGoogleWalletPass` callable (Functions-new) to upsert a
 * Wallet class+object for the hacker, then returns the signed `saveUrl` the
 * browser should open to land on Google's "Save to Wallet" page.
 *
 * Mirrors the `qrValue` construction used by `components/features/my-ticket/ticket.tsx:52-54`:
 * `${origin}/${activeHackathon}/social-profile/${uid}`.
 *
 * A returned `assetsMissing`/`missingAssets` means this hackathon's Storage
 * assets (`assets/{dbCollectionName}/google/`) are not available, so the
 * callable generated the pass without logo/hero — the caller should surface
 * that to the user instead of treating it as a generic failure.
 */
export async function addHackerPassToGoogleWallet(
  dbCollectionName: string,
  qrValue: string,
): Promise<{
  saveUrl: string;
  assetsMissing: boolean;
  missingAssets: string[];
}> {
  const result = await generateGoogleWalletPass({ dbCollectionName, qrValue });
  return {
    saveUrl: result.data.saveUrl,
    assetsMissing: result.data.assetsMissing ?? false,
    missingAssets: result.data.missingAssets ?? [],
  };
}

interface GenerateAppleWalletPassInput {
  dbCollectionName: string;
  qrValue: string;
}

interface GenerateAppleWalletPassOutput {
  success: boolean;
  storagePath: string;
}

const generateAppleWalletPass = httpsCallable<
  GenerateAppleWalletPassInput,
  GenerateAppleWalletPassOutput
>(functions, "generateAppleWalletPass");

/**
 * Calls the `generateAppleWalletPass` callable (Functions-new, `wallet/apple`
 * branch) to build and sign a `.pkpass` for the hacker, then returns the
 * owner-private Storage path (`passes/{dbCollectionName}/{uid}`). The caller
 * resolves a tokenized download URL with the client SDK `getDownloadURL` so the
 * owner's signed-in auth passes the storage rules.
 *
 * Mirrors the `qrValue` construction used by `components/features/my-ticket/ticket.tsx:52-54`:
 * `${origin}/${activeHackathon}/social-profile/${uid}`.
 */
export async function addHackerPassToAppleWallet(
  dbCollectionName: string,
  qrValue: string,
): Promise<string> {
  const result = await generateAppleWalletPass({ dbCollectionName, qrValue });
  return result.data.storagePath;
}
