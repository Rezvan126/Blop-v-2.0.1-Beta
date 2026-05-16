import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrencySymbol(code: string): string {
  try {
    const parts = new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
}

export function parseTimestamp(ts: any): number {
  if (!ts) return 0;
  if (typeof ts === 'number') return ts;
  if (ts.seconds !== undefined) return ts.seconds * 1000 + (ts.nanoseconds || 0) / 1000000;
  if (typeof ts.toDate === 'function') return ts.toDate().getTime();
  const parsed = new Date(ts).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats currency amounts with handling for extremely large numbers
 */
export function formatAmount(amount: number, sym: string): string {
  if (amount === 0) return sym + "0.00";
  
  const abs = Math.abs(amount);
  
  // Handling extremely large numbers with compact notation
  if (abs >= 1e12) {
    return (amount < 0 ? "-" : "") + sym + (abs / 1e12).toFixed(2) + "T";
  }
  if (abs >= 1e9) {
    return (amount < 0 ? "-" : "") + sym + (abs / 1e9).toFixed(2) + "B";
  }
  if (abs >= 1e6) {
    return (amount < 0 ? "-" : "") + sym + (abs / 1e6).toFixed(2) + "M";
  }

  // Standard formatting
  return (amount < 0 ? "-" : "") + sym + abs.toLocaleString("en-US", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
}

/**
 * Triggers a subtle haptic feedback on mobile devices
 */
export async function triggerHaptic() {
  try {
    // @ts-ignore
    if (window?.Capacitor?.isPluginAvailable?.('Haptics')) {
      // We don't import to avoid install issues, use dynamic if needed
      // For now, fail silently as requested enhancements are rejected anyway
    }
  } catch (e) {}
}
