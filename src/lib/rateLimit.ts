/**
 * Simple in-memory rate limiter for the /api/search route.
 * Limits each IP to MAX_REQUESTS per WINDOW_MS.
 * Note: This is per-instance (not distributed). For production at scale,
 * swap for an upstash/redis backed limiter.
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const MAX_REQUESTS = 10; // max requests per window
const WINDOW_MS = 60_000; // 1 minute

/**
 * Returns true if the given key (IP) is within the rate limit.
 * Returns false if the limit has been exceeded.
 */
export function checkRateLimit(key: string): boolean {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
        // First request in the window, or window has expired
        store.set(key, { count: 1, resetAt: now + WINDOW_MS });
        return true;
    }

    if (entry.count >= MAX_REQUESTS) {
        return false; // Rate limit exceeded
    }

    entry.count += 1;
    return true;
}
