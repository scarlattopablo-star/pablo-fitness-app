// Offline cache utilities using localStorage
// Stores client data with timestamps for offline fallback

const CACHE_PREFIX = "offline_";
const DEFAULT_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedItem<T> {
  data: T;
  timestamp: number;
}

export function cacheData<T>(key: string, data: T): void {
  try {
    const item: CachedItem<T> = { data, timestamp: Date.now() };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
  } catch {
    // localStorage full or unavailable - silently fail
  }
}

export function getCachedData<T>(key: string, maxAge: number = DEFAULT_MAX_AGE): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const item: CachedItem<T> = JSON.parse(raw);
    if (Date.now() - item.timestamp > maxAge) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return item.data;
  } catch {
    return null;
  }
}

export function clearOfflineCache(): void {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
  } catch {
    // silently fail
  }
}

// Hook to detect online/offline status
export function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}
