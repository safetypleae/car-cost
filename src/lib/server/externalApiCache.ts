type MemoryEntry = {
  expiresAt: number;
  value: unknown;
};

type CachedJsonOptions = {
  identity: string;
  namespace: string;
  ttlSeconds: number;
  fetcher: () => Promise<Response>;
};

const MAX_MEMORY_ENTRIES = 256;
const memoryCache = new Map<string, MemoryEntry>();
const pendingRequests = new Map<string, Promise<unknown>>();

async function digest(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function getWorkersCache(): Cache | undefined {
  const storage = Reflect.get(globalThis, "caches") as { default?: Cache } | undefined;
  return storage?.default;
}

function remember(key: string, value: unknown, ttlSeconds: number) {
  const now = Date.now();
  for (const [cachedKey, entry] of memoryCache) {
    if (entry.expiresAt <= now) memoryCache.delete(cachedKey);
  }
  if (memoryCache.size >= MAX_MEMORY_ENTRIES) {
    const oldestKey = memoryCache.keys().next().value as string | undefined;
    if (oldestKey) memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, { expiresAt: now + ttlSeconds * 1000, value });
}

async function readCached<T>(key: string, cacheRequest: Request): Promise<T | undefined> {
  const memoryEntry = memoryCache.get(key);
  if (memoryEntry && memoryEntry.expiresAt > Date.now()) return memoryEntry.value as T;
  if (memoryEntry) memoryCache.delete(key);

  const workersCache = getWorkersCache();
  if (!workersCache) return undefined;
  try {
    const response = await workersCache.match(cacheRequest);
    if (response?.ok) return await response.json() as T;
  } catch {
    // Cache API can be unavailable in next dev and some Wrangler preview modes.
  }
  return undefined;
}

async function writeCached(key: string, cacheRequest: Request, value: unknown, ttlSeconds: number) {
  remember(key, value, ttlSeconds);
  const workersCache = getWorkersCache();
  if (!workersCache) return;
  try {
    await workersCache.put(cacheRequest, Response.json(value, {
      headers: { "Cache-Control": `public, max-age=${ttlSeconds}` },
    }));
  } catch {
    // The in-memory cache still provides per-isolate reuse when Cache API writes are unavailable.
  }
}

/**
 * Cache successful third-party JSON responses without storing credentials in cache keys.
 * Cloudflare's Cache API is regional, so the memory layer also coalesces identical requests
 * handled concurrently by the same Worker isolate.
 */
export async function fetchCachedJson<T>({
  identity,
  namespace,
  ttlSeconds,
  fetcher,
}: CachedJsonOptions): Promise<T> {
  const hash = await digest(`${namespace}:${identity}`);
  const key = `${namespace}:${hash}`;
  const cacheRequest = new Request(`https://cache.car-cost.internal/external/${namespace}/${hash}`);
  const cached = await readCached<T>(key, cacheRequest);
  if (cached !== undefined) return cached;

  const pending = pendingRequests.get(key);
  if (pending) return pending as Promise<T>;

  const request = (async () => {
    const response = await fetcher();
    if (!response.ok) throw new Error(`External API HTTP ${response.status}`);
    const value = await response.json() as T;
    await writeCached(key, cacheRequest, value, ttlSeconds);
    return value;
  })();

  pendingRequests.set(key, request);
  try {
    return await request;
  } finally {
    pendingRequests.delete(key);
  }
}
