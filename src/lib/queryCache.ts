interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

const cache = new Map<string, CacheEntry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()

function isFresh<T>(entry: CacheEntry<T>): boolean {
  return Date.now() - entry.timestamp < entry.ttl
}

interface CachedQueryOptions {
  /** Cache time-to-live in milliseconds */
  ttl: number
  /**
   * If true, returns stale data immediately and refetches in the background.
   * The onUpdate callback receives the fresh data when ready.
   */
  staleWhileRevalidate?: boolean
}

/**
 * Cached query with TTL, request deduplication, and stale-while-revalidate.
 *
 * - Returns cached data if fresh (within TTL)
 * - If the same key is already being fetched, shares the in-flight promise
 * - With SWR: returns stale data immediately, refetches in background
 */
export async function cachedQuery<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CachedQueryOptions,
  onUpdate?: (data: T) => void,
): Promise<T> {
  const existing = cache.get(key) as CacheEntry<T> | undefined

  // Fresh cache hit — return immediately
  if (existing && isFresh(existing)) {
    return existing.data
  }

  // Stale cache hit with SWR — return stale, refetch in background
  if (existing && options.staleWhileRevalidate) {
    // Only trigger background refetch if one isn't already in-flight
    if (!inflight.has(key)) {
      const bgFetch = fetchFn().then((data) => {
        cache.set(key, { data, timestamp: Date.now(), ttl: options.ttl })
        inflight.delete(key)
        onUpdate?.(data)
        return data
      }).catch(() => {
        inflight.delete(key)
      })
      inflight.set(key, bgFetch)
    }
    return existing.data
  }

  // Deduplicate: if the same query is already in-flight, share the promise
  const existing_inflight = inflight.get(key)
  if (existing_inflight) {
    return existing_inflight as Promise<T>
  }

  // Fresh fetch
  const promise = fetchFn().then((data) => {
    cache.set(key, { data, timestamp: Date.now(), ttl: options.ttl })
    inflight.delete(key)
    return data
  }).catch((err) => {
    inflight.delete(key)
    throw err
  })

  inflight.set(key, promise)
  return promise
}

/** Invalidate all cache entries matching a key prefix */
export function invalidateCache(keyPrefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(keyPrefix)) {
      cache.delete(key)
    }
  }
}

/** Invalidate a single cache entry by exact key */
export function invalidateCacheKey(key: string): void {
  cache.delete(key)
}

/** Clear the entire cache */
export function clearCache(): void {
  cache.clear()
}
