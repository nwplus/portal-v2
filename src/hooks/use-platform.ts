import { useEffect, useState } from "react";

export type WalletPlatform = "apple" | "google" | "other";

/**
 * Detects the wallet platform for the current device:
 * - "apple": iPhone/iPad/iPod, including iPadOS 13+ which reports itself as
 *   "MacIntel" with touch points (desktop-class UA)
 * - "google": Android devices (Google Wallet is only add-able on Android)
 * - "other": desktop — both buttons are shown as a fallback
 *
 * Starts as "other" and resolves after mount so SSR/hydration stays safe; the
 * wallet-visible swap only affects which wallet buttons render.
 */
export function useWalletPlatform(): WalletPlatform {
  const [platform, setPlatform] = useState<WalletPlatform>("other");

  useEffect(() => {
    setPlatform(detectWalletPlatform());
  }, []);

  return platform;
}

export function detectWalletPlatform(): WalletPlatform {
  if (typeof navigator === "undefined") return "other";

  const ua = navigator.userAgent;
  const isIOS =
    /iPhone|iPod/i.test(ua) ||
    /iPad/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIOS) return "apple";
  if (/Android/i.test(ua)) return "google";
  return "other";
}
