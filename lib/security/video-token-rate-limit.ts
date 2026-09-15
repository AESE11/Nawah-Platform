const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

type RateLimitEntry = {
  requests: number[];
};

const requestsByUser = new Map<string, RateLimitEntry>();

export interface VideoTokenRateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * Lightweight per-process protection for token issuance. It intentionally does
 * not sit in the Mux media path, where segment requests must remain unrestricted.
 */
export function checkVideoTokenRateLimit(userId: string, now = Date.now()): VideoTokenRateLimitResult {
  const earliestAllowedAt = now - WINDOW_MS;
  const entry = requestsByUser.get(userId) ?? { requests: [] };
  entry.requests = entry.requests.filter((requestedAt) => requestedAt > earliestAllowedAt);

  if (entry.requests.length >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.requests[0] + WINDOW_MS - now) / 1000));
    requestsByUser.set(userId, entry);
    return { allowed: false, retryAfterSeconds };
  }

  entry.requests.push(now);
  requestsByUser.set(userId, entry);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetVideoTokenRateLimitsForTests() {
  requestsByUser.clear();
}
