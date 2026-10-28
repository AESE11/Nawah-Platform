import test from "node:test";
import assert from "node:assert/strict";

import {
  createMobileAuthToken,
  verifyMobileAuthTokenWith,
  type MobileAuthUserRecord,
} from "../lib/mobile/auth-token";
import {
  createPasswordAuthVersion,
  isPasswordAuthVersionCurrent,
} from "../lib/security/password-auth-version";
import { isWebSessionCurrent } from "../lib/security/web-session";
import {
  checkLoginRateLimitWith,
  type RateLimiter,
  type RateLimitResult,
} from "../lib/security/rate-limit-core";
import { LOGIN_RATE_LIMITS } from "../lib/security/rate-limit";

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

test("login rate limiter checks IP and normalized email and reports retry time", async () => {
  assert.deepEqual(LOGIN_RATE_LIMITS, {
    ip: { requests: 30, window: "15 m" },
    email: { requests: 5, window: "15 m" },
  });

  const ip = mockLimiter([{ success: true, reset: 900_000 }]);
  const email = mockLimiter([{ success: false, reset: 61_000 }]);

  const result = await checkLoginRateLimitWith(
    "ip-digest",
    " User@Example.com ",
    ip.limiter,
    email.limiter,
    () => 1_000,
  );

  assert.deepEqual(result, { success: false, retryAfter: 60 });
  assert.deepEqual(ip.keys, ["ip-digest"]);
  assert.deepEqual(email.keys, ["user@example.com"]);
});

test("login rate limiter rejects an exhausted IP without consuming an email attempt", async () => {
  const ip = mockLimiter([{ success: false, reset: 31_000 }]);
  const email = mockLimiter([]);

  const result = await checkLoginRateLimitWith(
    "ip-digest",
    "user@example.com",
    ip.limiter,
    email.limiter,
    () => 1_000,
  );

  assert.deepEqual(result, { success: false, retryAfter: 30 });
  assert.equal(email.keys.length, 0);
});

test("password auth version changes when the password or secret changes", () => {
  const version = createPasswordAuthVersion("bcrypt-hash-one", "test-secret");

  assert.equal(
    isPasswordAuthVersionCurrent(version, "bcrypt-hash-one", "test-secret"),
    true,
  );
  assert.equal(
    isPasswordAuthVersionCurrent(version, "bcrypt-hash-two", "test-secret"),
    false,
  );
  assert.equal(
    isPasswordAuthVersionCurrent(version, "bcrypt-hash-one", "other-secret"),
    false,
  );
  assert.equal(
    isPasswordAuthVersionCurrent(undefined, "bcrypt-hash-one", "test-secret"),
    false,
  );
});

test("web sessions require the current password version and database role", () => {
  const secret = "local-test-web-auth-secret";
  const passwordHash = "stored-bcrypt-hash";
  const token = {
    sub: "student-1",
    role: "STUDENT",
    passwordAuthVersion: createPasswordAuthVersion(passwordHash, secret),
  };

  assert.equal(
    isWebSessionCurrent(
      token,
      { role: "STUDENT", passwordHash },
      secret,
    ),
    true,
  );
  assert.equal(
    isWebSessionCurrent(
      { ...token, role: "ADMIN" },
      { role: "STUDENT", passwordHash },
      secret,
    ),
    false,
  );
  assert.equal(
    isWebSessionCurrent(token, null, secret),
    false,
  );
  assert.equal(
    isWebSessionCurrent(token, { role: "STUDENT", passwordHash }, ""),
    false,
  );
});

test("mobile tokens are rejected once the stored password hash changes", async () => {
  const secret = "local-test-mobile-auth-secret";
  const passwordHash = "stored-bcrypt-hash-before-reset";
  const token = await createMobileAuthToken({
    userId: "student-1",
    role: "STUDENT",
    passwordHash,
  }, secret);
  const currentUser: MobileAuthUserRecord = {
    role: "STUDENT",
    passwordHash,
  };

  assert.deepEqual(
    await verifyMobileAuthTokenWith(token, async () => currentUser, secret),
    { userId: "student-1", role: "STUDENT" },
  );

  await assert.rejects(
    verifyMobileAuthTokenWith(
      token,
      async () => ({
        role: "STUDENT",
        passwordHash: "stored-bcrypt-hash-after-reset",
      }),
      secret,
    ),
    /Invalid mobile authentication token/,
  );
});
