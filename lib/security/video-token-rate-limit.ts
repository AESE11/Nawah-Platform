import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface VideoTokenRateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export const VIDEO_TOKEN_RATE_LIMIT = {
  requests: 10,
  window: "10 m",
} as const;

export interface VideoTokenRateLimiter {
  limit: (key: string) => Promise<{ success: boolean; reset: number }>;
}

let videoTokenLimiter: VideoTokenRateLimiter | undefined;

function getVideoTokenLimiter(): VideoTokenRateLimiter {
  if (videoTokenLimiter) {
    return videoTokenLimiter;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    throw new Error("Upstash rate limiting is not configured.");
  }

  videoTokenLimiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(
      VIDEO_TOKEN_RATE_LIMIT.requests,
      VIDEO_TOKEN_RATE_LIMIT.window,
    ),
    prefix: "nawah:video-token:user",
    analytics: false,
  });

  return videoTokenLimiter;
}

export async function checkVideoTokenRateLimitWith(
  userId: string,
  limiter: VideoTokenRateLimiter,
  now: () => number = Date.now,
): Promise<VideoTokenRateLimitResult> {
  const result = await limiter.limit(userId);

  if (result.success) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((result.reset - now()) / 1000)),
  };
}

export async function checkVideoTokenRateLimit(
  userId: string,
): Promise<VideoTokenRateLimitResult> {
  return checkVideoTokenRateLimitWith(userId, getVideoTokenLimiter());
}
