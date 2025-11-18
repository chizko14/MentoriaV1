// Advanced caching service with expiration and LRU eviction

const CACHE_KEY = 'mentoria_advanced_cache';
const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit

interface CacheEntry<T> {
  value: T;
  expiry: number;
  lastAccessed: number;
  size: number;
}

type CacheData<T> = Record<string, CacheEntry<T>>;

const getCache = <T>(): CacheData<T> => {
  try {
    const data = localStorage.getItem(CACHE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error("Failed to read from cache", e);
    return {};
  }
};

const saveCache = <T>(cache: CacheData<T>): void => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error("Failed to save to cache", e);
  }
};

const getCacheSize = <T>(cache: CacheData<T>): number => {
    return Object.values(cache).reduce((total, entry) => total + entry.size, 0);
};

const evictOldest = <T>(cache: CacheData<T>): void => {
    const sortedEntries = Object.entries(cache).sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    if (sortedEntries.length > 0) {
        const keyToDelete = sortedEntries[0][0];
        delete cache[keyToDelete];
        console.log(`Cache eviction: removed item '${keyToDelete}'`);
    }
};

const set = <T>(key: string, value: T): void => {
    let cache = getCache<T>();
    const valueStr = JSON.stringify(value);
    const entrySize = valueStr.length;

    // Evict entries if cache is full, until there is space
    while (getCacheSize(cache) + entrySize > CACHE_MAX_SIZE_BYTES) {
        evictOldest(cache);
    }
    
    const newEntry: CacheEntry<T> = {
        value,
        expiry: Date.now() + CACHE_EXPIRATION_MS,
        lastAccessed: Date.now(),
        size: entrySize,
    };
    cache[key] = newEntry;
    saveCache(cache);
};

const get = <T>(key: string): T | null => {
    const cache = getCache<T>();
    const entry = cache[key];

    if (!entry) {
        return null;
    }

    if (Date.now() > entry.expiry) {
        delete cache[key];
        saveCache(cache);
        return null;
    }

    // Update last accessed time for LRU
    entry.lastAccessed = Date.now();
    cache[key] = entry;
    saveCache(cache);

    return entry.value;
};

export const cacheService = {
  set,
  get,
};