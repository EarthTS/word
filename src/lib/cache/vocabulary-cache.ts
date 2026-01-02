interface CacheItem<T> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
}

class VocabularyCache {
    private cache: Map<string, CacheItem<unknown>>;
    private defaultTTL: number = 24 * 60 * 60 * 1000; // 24 hours default

    constructor() {
        this.cache = new Map();
    }

    set<T>(key: string, data: T, ttl?: number): void {
        const item: CacheItem<T> = {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTTL,
        };
        this.cache.set(key, item);
    }

    get<T>(key: string): T | null {
        const item = this.cache.get(key) as CacheItem<T> | undefined;

        if (!item) {
            return null;
        }

        // Check if cache is expired
        const now = Date.now();
        const age = now - item.timestamp;

        if (age > item.ttl) {
            // Cache expired, remove it
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    has(key: string): boolean {
        const item = this.cache.get(key);
        if (!item) {
            return false;
        }

        // Check if cache is expired
        const now = Date.now();
        const age = now - item.timestamp;

        if (age > item.ttl) {
            // Cache expired, remove it
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    // Clean up expired entries
    cleanup(): void {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            const age = now - item.timestamp;
            if (age > item.ttl) {
                this.cache.delete(key);
            }
        }
    }

    // Get cache statistics
    getStats() {
        this.cleanup();
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }
}

// Create a singleton instance
export const vocabularyCache = new VocabularyCache();

// Cleanup expired entries every hour
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        vocabularyCache.cleanup();
    }, 60 * 60 * 1000); // Every hour
}

