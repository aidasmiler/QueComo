export type Platform = 'ios' | 'android' | 'desktop';

/** Best-effort detection used only to order install instructions (never to block anything). */
export function detectPlatform(userAgent: string, maxTouchPoints = 0): Platform {
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
  // iPadOS 13+ reports itself as Macintosh but has touch support.
  if (/macintosh/i.test(userAgent) && maxTouchPoints > 1) return 'ios';
  if (/android/i.test(userAgent)) return 'android';
  return 'desktop';
}

export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia?.('(display-mode: standalone)').matches || nav.standalone === true;
}
