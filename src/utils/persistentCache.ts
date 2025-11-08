/**
 * Persistent cache utility using LocalStorage
 * Provides type-safe caching with automatic serialization/deserialization
 */

const CACHE_VERSION = '1';
const VERSION_KEY = 'nostr_cache_version';

// Check if localStorage is available
function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

// Initialize cache version
function initializeCacheVersion(): void {
  try {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    if (storedVersion !== CACHE_VERSION) {
      // Clear old cache if version mismatch
      clearAllCaches();
      localStorage.setItem(VERSION_KEY, CACHE_VERSION);
    }
  } catch (error) {
    console.warn('Failed to initialize cache version:', error);
  }
}

// Initialize on module load
if (isStorageAvailable()) {
  initializeCacheVersion();
}

/**
 * Get an item from the persistent cache
 */
export function getCacheItem<T>(key: string): T | null {
  if (!isStorageAvailable()) {
    return null;
  }

  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return null;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Failed to get cache item "${key}":`, error);
    return null;
  }
}

/**
 * Set an item in the persistent cache
 */
export function setCacheItem<T>(key: string, value: T): boolean {
  if (!isStorageAvailable()) {
    return false;
  }

  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('LocalStorage quota exceeded, clearing old cache entries');
      // Try to make space by clearing cache entries
      clearAllCaches();
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        console.error('Failed to store item even after clearing cache');
        return false;
      }
    }
    console.warn(`Failed to set cache item "${key}":`, error);
    return false;
  }
}

/**
 * Remove an item from the persistent cache
 */
export function removeCacheItem(key: string): void {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to remove cache item "${key}":`, error);
  }
}

/**
 * Clear all cache entries (notes and profiles)
 */
export function clearAllCaches(): void {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(
      key => key.startsWith('nostr_note_cache_') || key.startsWith('nostr_profile_cache_')
    );
    cacheKeys.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${cacheKeys.length} cache entries`);
  } catch (error) {
    console.warn('Failed to clear caches:', error);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { noteCount: number; profileCount: number } {
  if (!isStorageAvailable()) {
    return { noteCount: 0, profileCount: 0 };
  }

  try {
    const keys = Object.keys(localStorage);
    const noteCount = keys.filter(key => key.startsWith('nostr_note_cache_')).length;
    const profileCount = keys.filter(key => key.startsWith('nostr_profile_cache_')).length;
    return { noteCount, profileCount };
  } catch (error) {
    console.warn('Failed to get cache stats:', error);
    return { noteCount: 0, profileCount: 0 };
  }
}

// Cache key generators
export const getCacheKey = {
  note: (eventId: string) => `nostr_note_cache_${eventId}`,
  profile: (pubkey: string) => `nostr_profile_cache_${pubkey}`,
};

