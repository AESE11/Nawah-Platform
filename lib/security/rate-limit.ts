
import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import {
  checkPasswordResetCompletionRateLimitWith,
  checkLoginRateLimitWith,
  checkPasswordResetRateLimitWith,
} from "./rate-limit-core";

type PasswordResetLimiters = {
  ip: Ratelimit;
  email: Ratelimit;
};

type PasswordResetCompletionLimiters = {
  ip: Ratelimit;
  token: Ratelimit;
};

type LoginLimiters = {
  ip: Ratelimit;
  email: Ratelimit;
};

export const LOGIN_RATE_LIMITS = {
  ip: { requests: 30, window: "15 m" },
  email: { requests: 5, window: "15 m" },
} as const;

export const PASSWORD_RESET_COMPLETION_RATE_LIMITS = {
  ip: { requests: 10, window: "15 m" },
  token: { requests: 5, window: "15 m" },
} as const;

let passwordResetLimiters: PasswordResetLimiters | undefined;
let passwordResetCompletionLimiters:
  | PasswordResetCompletionLimiters
  | undefined;
let loginLimiters: LoginLimiters | undefined;

function createRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    throw new Error("Upstash rate limiting is not configured.");
  }

  return new Redis({ url, token });
}

function getPasswordResetLimiters(): PasswordResetLimiters {
  if (!passwordResetLimiters) {
    const redis = createRedisClient();
    passwordResetLimiters = {
      ip: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, "15 m"),
        prefix: "nawah:password-reset:ip",
        analytics: false,
      }),
      email: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(1, "60 s"),
        prefix: "nawah:password-reset:email",
        analytics: false,
      }),
    };
  }

  return passwordResetLimiters;
}

function getLoginLimiters(): LoginLimiters {
  if (!loginLimiters) {
    const redis = createRedisClient();
    loginLimiters = {
      ip: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(
          LOGIN_RATE_LIMITS.ip.requests,
          LOGIN_RATE_LIMITS.ip.window,
        ),
        prefix: "nawah:login:ip",
        analytics: false,
      }),
      email: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(
          LOGIN_RATE_LIMITS.email.requests,
          LOGIN_RATE_LIMITS.email.window,
        ),
        prefix: "nawah:login:email",
        analytics: false,
      }),
    };
  }

  return loginLimiters;
}

function getPasswordResetCompletionLimiters(): PasswordResetCompletionLimiters {
  if (!passwordResetCompletionLimiters) {
    const redis = createRedisClient();
    passwordResetCompletionLimiters = {
      ip: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(
          PASSWORD_RESET_COMPLETION_RATE_LIMITS.ip.requests,
          PASSWORD_RESET_COMPLETION_RATE_LIMITS.ip.window,
        ),
        prefix: "nawah:password-reset-completion:ip",
        analytics: false,
      }),
      token: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(
          PASSWORD_RESET_COMPLETION_RATE_LIMITS.token.requests,
          PASSWORD_RESET_COMPLETION_RATE_LIMITS.token.window,
        ),
        prefix: "nawah:password-reset-completion:token",
        analytics: false,
      }),
    };
  }

  return passwordResetCompletionLimiters;
}

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function checkLoginRateLimit(
  ip: string,
  email: string,
): Promise<{ success: boolean; retryAfter: number }> {
  const limiters = getLoginLimiters();

  return checkLoginRateLimitWith(
    hashValue(ip),
    hashValue(email.trim().toLowerCase()),
    limiters.ip,
    limiters.email,
  );
}

export async function checkPasswordResetRateLimit(
  ip: string,
  email: string,
): Promise<{ success: boolean; retryAfter: number }> {
  const limiters = getPasswordResetLimiters();

  return checkPasswordResetRateLimitWith(
    hashValue(ip),
    hashValue(email.trim().toLowerCase()),
    limiters.ip,
    limiters.email,
  );
}

export async function checkPasswordResetCompletionRateLimit(
  ip: string,
  tokenHash: string,
): Promise<{ success: boolean; retryAfter: number }> {
  const limiters = getPasswordResetCompletionLimiters();

  return checkPasswordResetCompletionRateLimitWith(
    hashValue(ip),
    hashValue(tokenHash),
    limiters.ip,
    limiters.token,
  );
}
