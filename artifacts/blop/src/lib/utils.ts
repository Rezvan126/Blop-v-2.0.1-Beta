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
 * Trigger purposeful haptic feedback using Capacitor Haptics.
 * Fails silently if on an unsupported platform or browser.
 */
export async function triggerHaptic(type: 'success' | 'warning' | 'error' | 'light' | 'selection' = 'light') {
  try {
    const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
    
    switch (type) {
      case 'success':
        await Haptics.notification({ type: NotificationType.Success });
        break;
      case 'warning':
        await Haptics.notification({ type: NotificationType.Warning });
        break;
      case 'error':
        await Haptics.notification({ type: NotificationType.Error });
        break;
      case 'light':
        await Haptics.impact({ style: ImpactStyle.Light });
        break;
      case 'selection':
        await Haptics.selectionStart();
        break;
    }
  } catch (e) {
    // Fail silently in browser or if not supported
  }
}
