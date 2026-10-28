import test from "node:test";
import assert from "node:assert/strict";

import {
  checkLoginRateLimitWith,
  checkPasswordResetCompletionRateLimitWith,
  checkPasswordResetRateLimitWith,
  type RateLimiter,
  type RateLimitResult,
} from "../lib/security/rate-limit-core";

function mockLimiter(results: RateLimitResult[]) {
  const keys: string[] = [];
  let index = 0;

  const limiter: RateLimiter = {
    async limit(key) {
      keys.push(key);
      const result = results[index++];

      if (!result) {
        throw new Error("Unexpected limiter call");
      }

      return result;
    },
  };

  return { limiter, keys };
}

test("allows a request when both limits allow it", async () => {
  const ip = mockLimiter([{ success: true, reset: 120_000 }]);
  const email = mockLimiter([{ success: true, reset: 60_000 }]);

  const result = await checkPasswordResetRateLimitWith(
    "ip-hash",
    " User@Example.com ",
    ip.limiter,
    email.limiter,
    () => 0,
  );

  assert.deepEqual(result, { success: true, retryAfter: 0 });
  assert.deepEqual(ip.keys, ["ip-hash"]);
  assert.deepEqual(email.keys, ["user@example.com"]);
});

test("rejects an IP that exceeded its limit without consuming an email attempt", async () => {
  const ip = mockLimiter([{ success: false, reset: 45_000 }]);
  const email = mockLimiter([]);

  const result = await checkPasswordResetRateLimitWith(
    "ip-hash",
    "user@example.com",
    ip.limiter,
    email.limiter,
    () => 10_000,
  );

  assert.deepEqual(result, { success: false, retryAfter: 35 });
  assert.equal(email.keys.length, 0);
});

test("rejects an email that exceeded its limit and reports retry time", async () => {
  const ip = mockLimiter([{ success: true, reset: 900_000 }]);
  const email = mockLimiter([{ success: false, reset: 61_000 }]);

  const result = await checkPasswordResetRateLimitWith(
    "ip-hash",
    "user@example.com",
    ip.limiter,
    email.limiter,
    () => 1_000,
  );

  assert.deepEqual(result, { success: false, retryAfter: 60 });
});

test("never returns a zero retry time for a rejected request", async () => {
  const ip = mockLimiter([{ success: false, reset: 500 }]);
  const email = mockLimiter([]);

  const result = await checkPasswordResetRateLimitWith(
    "ip-hash",
    "user@example.com",
    ip.limiter,
    email.limiter,
    () => 1_000,
  );

  assert.deepEqual(result, { success: false, retryAfter: 1 });
});

test("propagates limiter errors so the API can fail closed", async () => {
  const ip: RateLimiter = {
    async limit() {
      throw new Error("Redis unavailable");
    },
  };
  const email = mockLimiter([]);

  await assert.rejects(
    checkPasswordResetRateLimitWith(
      "ip-hash",
      "user@example.com",
      ip,
      email.limiter,
      () => 0,
    ),
    /Redis unavailable/,
  );

  assert.equal(email.keys.length, 0);
});


test("propagates email limiter errors so the API can fail closed", async () => {
  const ip = mockLimiter([{ success: true, reset: 900_000 }]);

  const email: RateLimiter = {
    async limit() {
      throw new Error("Redis unavailable for email limiter");
    },
  };

  await assert.rejects(
    checkPasswordResetRateLimitWith(
      "ip-hash",
      "user@example.com",
      ip.limiter,
      email,
      () => 0,
    ),
    /Redis unavailable for email limiter/,
  );

  assert.deepEqual(ip.keys, ["ip-hash"]);
});

test("completion rate limiter keys by IP and token hash and returns retry time", async () => {
  const ip = mockLimiter([{ success: true, reset: 900_000 }]);
  const token = mockLimiter([{ success: false, reset: 61_000 }]);

  const result = await checkPasswordResetCompletionRateLimitWith(
    "ip-hash",
    "token-hash",
    ip.limiter,
    token.limiter,
    () => 1_000,
  );

  assert.deepEqual(result, { success: false, retryAfter: 60 });
  assert.deepEqual(ip.keys, ["ip-hash"]);
  assert.deepEqual(token.keys, ["token-hash"]);
});

test("completion rate limiter propagates Redis failures", async () => {
  const ip = mockLimiter([{ success: true, reset: 900_000 }]);
  const token: RateLimiter = {
    async limit() {
      throw new Error("Redis unavailable for reset token limiter");
    },
  };

  await assert.rejects(
    checkPasswordResetCompletionRateLimitWith(
      "ip-hash",
      "token-hash",
      ip.limiter,
      token,
      () => 0,
    ),
    /Redis unavailable for reset token limiter/,
  );
});

test("login rate limiter rejects after a mock counter exhausts the IP budget", async () => {
  function createCounterLimiter(maxRequests: number) {
    const counts = new Map<string, number>();
    const limiter: RateLimiter = {
      async limit(key) {
        const count = (counts.get(key) ?? 0) + 1;
        counts.set(key, count);
        return {
          success: count <= maxRequests,
          reset: 60_000,
        };
      },
    };

    return { limiter, counts };
  }

  const ip = createCounterLimiter(2);
  const email = createCounterLimiter(10);
  const results = [];

  for (let attempt = 0; attempt < 3; attempt += 1) {
    results.push(
      await checkLoginRateLimitWith(
        "ip-hash",
        "user@example.com",
        ip.limiter,
        email.limiter,
        () => 0,
      ),
    );
  }

  assert.deepEqual(
    results.map((result) => result.success),
    [true, true, false],
  );
  assert.equal(ip.counts.get("ip-hash"), 3);
  assert.equal(email.counts.get("user@example.com"), 2);
});
