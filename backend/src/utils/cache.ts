/**
 * Simple in-memory cache with TTL support
 * Good for development. For production, consider Redis
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class SimpleCache {
  cache: Map<string, CacheEntry<any>> = new Map(); // Made public for iteration
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiresAt });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

export const appCache = new SimpleCache();

/**
 * Cache key generators
 */
export function getDashboardCacheKey(userId: string, date: Date): string {
  const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  return `dashboard:stats:${userId}:${dateStr}`;
}

export function getUserCachePrefix(userId: string): string {
  return `user:${userId}`;
}

/**
 * Invalidate all cache entries for a specific user
 * Call this when user performs any mutation (add task, mark habit, etc.)
 */
export function invalidateUserCache(userId: string): void {
  const prefix = getUserCachePrefix(userId);
  const keysToDelete: string[] = [];

  // Find all keys that match the user prefix
  const cacheIterator = appCache['cache'].entries();
  for (const [key] of cacheIterator) {
    if (key.includes(prefix) || key.includes(`dashboard:stats:${userId}`)) {
      keysToDelete.push(key);
    }
  }

  // Delete them
  keysToDelete.forEach(key => appCache.delete(key));
}

/**
 * Invalidate specific cache entry
 */
export function invalidateDashboardCache(userId: string): void {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  const key = `dashboard:stats:${userId}:${dateStr}`;
  appCache.delete(key);
}
