export type RateLimitResult = {
  success: boolean;
  reset: number;
};

export type RateLimiter = {
  limit: (key: string) => Promise<RateLimitResult>;
};

export type PasswordResetRateLimitResult = {
  success: boolean;
  retryAfter: number;
};

async function checkTwoKeyRateLimitWith(
  ip: string,
  email: string,
  ipLimiter: RateLimiter,
  emailLimiter: RateLimiter,
  now: () => number = Date.now,
): Promise<PasswordResetRateLimitResult> {
  const ipResult = await ipLimiter.limit(ip);

  if (!ipResult.success) {
    return {
      success: false,
      retryAfter: Math.max(1, Math.ceil((ipResult.reset - now()) / 1000)),
    };
  }

  const emailResult = await emailLimiter.limit(email.trim().toLowerCase());

  if (!emailResult.success) {
    return {
      success: false,
      retryAfter: Math.max(1, Math.ceil((emailResult.reset - now()) / 1000)),
    };
  }

  return { success: true, retryAfter: 0 };
}

export async function checkLoginRateLimitWith(
  ip: string,
  email: string,
  ipLimiter: RateLimiter,
  emailLimiter: RateLimiter,
  now: () => number = Date.now,
): Promise<PasswordResetRateLimitResult> {
  return checkTwoKeyRateLimitWith(ip, email, ipLimiter, emailLimiter, now);
}

export async function checkPasswordResetRateLimitWith(
  ip: string,
  email: string,
  ipLimiter: RateLimiter,
  emailLimiter: RateLimiter,
  now: () => number = Date.now,
): Promise<PasswordResetRateLimitResult> {
  return checkTwoKeyRateLimitWith(ip, email, ipLimiter, emailLimiter, now);
}

export async function checkPasswordResetCompletionRateLimitWith(
  ip: string,
  tokenHash: string,
  ipLimiter: RateLimiter,
  tokenLimiter: RateLimiter,
  now: () => number = Date.now,
): Promise<PasswordResetRateLimitResult> {
  return checkTwoKeyRateLimitWith(ip, tokenHash, ipLimiter, tokenLimiter, now);
}
