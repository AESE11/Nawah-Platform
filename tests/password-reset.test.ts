
import test from "node:test";
import assert from "node:assert/strict";

import {
  createPasswordResetToken,
  hashPasswordResetToken,
  PASSWORD_RESET_TTL_MS,
  isPasswordResetTokenValid,
} from "../lib/security/password-reset";
import {
  createPasswordResetDeliveryTask,
  type PasswordResetDeliveryDependencies,
} from "../lib/security/password-reset-delivery";
import {
  GENERIC_PASSWORD_RESET_RESPONSE,
  schedulePasswordResetDelivery,
  type PasswordResetDeliveryTask,
  type PasswordResetRecipient,
} from "../lib/security/password-reset-request";
import {
  completePasswordReset,
  type PasswordResetCompletionDependencies,
  type PasswordResetRecord,
} from "../lib/security/password-reset-completion";
import { PASSWORD_RESET_COMPLETION_RATE_LIMITS } from "../lib/security/rate-limit";

test("creates a cryptographically random token and stores only its hash", () => {
  const first = createPasswordResetToken();
  const second = createPasswordResetToken();

  assert.notEqual(first.token, second.token);
  assert.notEqual(first.tokenHash, first.token);
  assert.equal(first.tokenHash, hashPasswordResetToken(first.token));
  assert.equal(first.tokenHash.length, 64);
  assert.equal(/^[a-f0-9]{64}$/.test(first.tokenHash), true);
});

test("sets reset token expiration to 30 minutes", () => {
  const before = Date.now();
  const result = createPasswordResetToken();
  const after = Date.now();

  assert.ok(
    result.expiresAt.getTime() >= before + PASSWORD_RESET_TTL_MS,
  );
  assert.ok(
    result.expiresAt.getTime() <= after + PASSWORD_RESET_TTL_MS,
  );
  assert.equal(PASSWORD_RESET_TTL_MS, 30 * 60 * 1000);
});

test("hashes the same token consistently", () => {
  const token = "test-reset-token";

  assert.equal(
    hashPasswordResetToken(token),
    hashPasswordResetToken(token),
  );
  assert.notEqual(
    hashPasswordResetToken(token),
    hashPasswordResetToken("different-token"),
  );
});


test("accepts an unused token before expiration", () => {
  const now = new Date("2026-10-26T12:00:00.000Z");

  assert.equal(
    isPasswordResetTokenValid(
      {
        usedAt: null,
        expiresAt: new Date("2026-10-26T12:30:00.000Z"),
      },
      now,
    ),
    true,
  );
});

test("rejects an expired token", () => {
  const now = new Date("2026-10-26T12:31:00.000Z");

  assert.equal(
    isPasswordResetTokenValid(
      {
        usedAt: null,
        expiresAt: new Date("2026-10-26T12:30:00.000Z"),
      },
      now,
    ),
    false,
  );
});

test("rejects a token that has already been used", () => {
  const now = new Date("2026-10-26T12:10:00.000Z");

  assert.equal(
    isPasswordResetTokenValid(
      {
        usedAt: new Date("2026-10-26T12:05:00.000Z"),
        expiresAt: new Date("2026-10-26T12:30:00.000Z"),
      },
      now,
    ),
    false,
  );
});

test("forgot-password response is identical and only registered users are queued", async () => {
  const scheduledTasks: PasswordResetDeliveryTask[] = [];
  const deliveredRecipients: string[] = [];
  const deliver = async (recipient: PasswordResetRecipient) => {
    deliveredRecipients.push(recipient.email);
  };

  const unknownResponse = schedulePasswordResetDelivery(
    null,
    (task) => scheduledTasks.push(task),
    deliver,
  );
  const passwordlessResponse = schedulePasswordResetDelivery(
    {
      id: "oauth-user",
      email: "oauth@example.com",
      passwordHash: null,
    },
    (task) => scheduledTasks.push(task),
    deliver,
  );
  const knownUser = {
    id: "user-1",
    email: "known@example.com",
    passwordHash: "bcrypt-hash",
  };
  const knownResponse = schedulePasswordResetDelivery(
    knownUser,
    (task) => scheduledTasks.push(task),
    deliver,
  );

  assert.deepEqual(unknownResponse, GENERIC_PASSWORD_RESET_RESPONSE);
  assert.deepEqual(passwordlessResponse, unknownResponse);
  assert.deepEqual(knownResponse, unknownResponse);
  assert.equal(unknownResponse.status, 200);
  assert.deepEqual(unknownResponse.headers, { "Cache-Control": "no-store" });
  assert.equal(scheduledTasks.length, 1);
  assert.deepEqual(deliveredRecipients, []);

  await scheduledTasks[0]();
  assert.deepEqual(deliveredRecipients, ["known@example.com"]);
});

test("delivery scheduling errors preserve the generic response and do not send inline", () => {
  const logMessages: string[] = [];
  let delivered = false;
  const response = schedulePasswordResetDelivery(
    {
      id: "user-1",
      email: "known@example.com",
      passwordHash: "bcrypt-hash",
    },
    () => {
      throw new Error("runtime scheduler details");
    },
    async () => {
      delivered = true;
    },
    () => logMessages.push("Password reset delivery could not be scheduled."),
  );

  assert.deepEqual(response, GENERIC_PASSWORD_RESET_RESPONSE);
  assert.equal(delivered, false);
  assert.deepEqual(logMessages, [
    "Password reset delivery could not be scheduled.",
  ]);
});

test("password-reset delivery failures are logged safely and clean up issued tokens", async () => {
  const token = createPasswordResetToken();
  const calls: string[] = [];
  const logMessages: string[] = [];
  const dependencies: PasswordResetDeliveryDependencies = {
    baseUrl: "https://example.com",
    createToken: () => token,
    async persistToken() {
      calls.push("persist");
    },
    async deleteToken(tokenHash) {
      assert.equal(tokenHash, token.tokenHash);
      calls.push("delete");
    },
    async sendEmail() {
      calls.push("email");
      throw new Error("transport details must not be logged");
    },
    logError(message) {
      logMessages.push(message);
    },
  };

  await createPasswordResetDeliveryTask(
    { id: "user-1", email: "user@example.com" },
    dependencies,
  )();

  assert.deepEqual(calls, ["persist", "email", "delete"]);
  assert.deepEqual(logMessages, ["Password reset delivery failed."]);
});

test("password-reset persistence errors do not escape the deferred delivery task", async () => {
  const token = createPasswordResetToken();
  const calls: string[] = [];
  const dependencies: PasswordResetDeliveryDependencies = {
    baseUrl: "https://example.com",
    createToken: () => token,
    async persistToken() {
      throw new Error("database details must not escape");
    },
    async deleteToken() {
      calls.push("delete");
    },
    async sendEmail() {
      calls.push("email");
    },
    logError(message) {
      calls.push(message);
    },
  };

  await assert.doesNotReject(
    createPasswordResetDeliveryTask(
      { id: "user-1", email: "user@example.com" },
      dependencies,
    )(),
  );
  assert.deepEqual(calls, ["delete", "Password reset delivery failed."]);
});

test("invalid reset base URL sends no email and creates no database token", async () => {
  const calls: string[] = [];
  const dependencies: PasswordResetDeliveryDependencies = {
    baseUrl: "http://untrusted.example.com",
    createToken: () => {
      calls.push("token");
      return createPasswordResetToken();
    },
    async persistToken() {
      calls.push("persist");
    },
    async deleteToken() {
      calls.push("delete");
    },
    async sendEmail() {
      calls.push("email");
    },
    logError(message) {
      calls.push(message);
    },
  };

  await createPasswordResetDeliveryTask(
    { id: "user-1", email: "user@example.com" },
    dependencies,
  )();
  assert.deepEqual(calls, [
    "Password reset unavailable: APP_BASE_URL is invalid.",
  ]);
});

function createCompletionDependencies(
  tokenRecord: PasswordResetRecord | null,
  overrides: Partial<PasswordResetCompletionDependencies> = {},
) {
  const calls: string[] = [];
  const dependencies: PasswordResetCompletionDependencies = {
    async checkRateLimit() {
      calls.push("rate-limit");
      return { success: true, retryAfter: 0 };
    },
    async findToken() {
      calls.push("find-token");
      return tokenRecord;
    },
    async hashPassword(password) {
      calls.push("hash-password");
      return `hash:${password}`;
    },
    async consumeAndUpdatePassword(_tokenHash, passwordHash) {
      calls.push(`consume:${passwordHash}`);
    },
    ...overrides,
  };

  return { calls, dependencies };
}

test("reset password validates token format and fields before hashing", async () => {
  const tokenRecord = null;
  const { calls, dependencies } = createCompletionDependencies(tokenRecord);

  const result = await completePasswordReset(
    { token: "malformed-token", newPassword: "long-enough-password" },
    "203.0.113.1",
    dependencies,
  );

  assert.deepEqual(result, { status: "invalid-request" });
  assert.deepEqual(calls, []);
});

test("expired and used reset tokens are rejected before password hashing", async () => {
  const now = new Date("2026-10-27T00:00:00.000Z");
  const token = createPasswordResetToken().token;

  for (const tokenRecord of [
    {
      id: "expired",
      userId: "user-1",
      expiresAt: new Date(now.getTime() - 1),
      usedAt: null,
    },
    {
      id: "used",
      userId: "user-1",
      expiresAt: new Date(now.getTime() + 60_000),
      usedAt: new Date(now.getTime() - 1),
    },
  ]) {
    const { calls, dependencies } = createCompletionDependencies(tokenRecord, {
      now: () => now,
    });

    assert.deepEqual(
      await completePasswordReset(
        { token, newPassword: "long-enough-password" },
        "203.0.113.1",
        dependencies,
      ),
      { status: "invalid-token" },
    );
    assert.deepEqual(calls, ["rate-limit", "find-token"]);
  }
});

test("reset password rate limiting rejects requests before token lookup or hashing", async () => {
  assert.deepEqual(PASSWORD_RESET_COMPLETION_RATE_LIMITS, {
    ip: { requests: 10, window: "15 m" },
    token: { requests: 5, window: "15 m" },
  });

  const token = createPasswordResetToken().token;
  const { calls, dependencies } = createCompletionDependencies(null, {
    async checkRateLimit() {
      calls.push("rate-limit");
      return { success: false, retryAfter: 90 };
    },
  });

  assert.deepEqual(
    await completePasswordReset(
      { token, newPassword: "long-enough-password" },
      "203.0.113.1",
      dependencies,
    ),
    { status: "rate-limited", retryAfter: 90 },
  );
  assert.deepEqual(calls, ["rate-limit"]);
});

test("reset password fails closed when Redis rate limiting fails", async () => {
  const token = createPasswordResetToken().token;
  const { calls, dependencies } = createCompletionDependencies(null, {
    async checkRateLimit() {
      calls.push("rate-limit");
      throw new Error("Redis connection details");
    },
  });

  assert.deepEqual(
    await completePasswordReset(
      { token, newPassword: "long-enough-password" },
      "203.0.113.1",
      dependencies,
    ),
    { status: "unavailable" },
  );
  assert.deepEqual(calls, ["rate-limit"]);
});

test("valid reset hashes after token verification and consumes it before updating", async () => {
  const token = createPasswordResetToken().token;
  const tokenRecord: PasswordResetRecord = {
    id: "reset-1",
    userId: "user-1",
    expiresAt: new Date(Date.now() + 60_000),
    usedAt: null,
  };
  const { calls, dependencies } = createCompletionDependencies(tokenRecord);

  assert.deepEqual(
    await completePasswordReset(
      { token, newPassword: "long-enough-password" },
      "203.0.113.1",
      dependencies,
    ),
    { status: "success" },
  );
  assert.deepEqual(calls, [
    "rate-limit",
    "find-token",
    "hash-password",
    "consume:hash:long-enough-password",
  ]);
});

test("a token consumed concurrently after preflight cannot complete a second reset", async () => {
  const token = createPasswordResetToken().token;
  const tokenRecord: PasswordResetRecord = {
    id: "reset-1",
    userId: "user-1",
    expiresAt: new Date(Date.now() + 60_000),
    usedAt: null,
  };
  const { calls, dependencies } = createCompletionDependencies(tokenRecord, {
    async consumeAndUpdatePassword() {
      calls.push("atomic-consume");
      throw new Error("INVALID_OR_EXPIRED_RESET_TOKEN");
    },
  });

  assert.deepEqual(
    await completePasswordReset(
      { token, newPassword: "long-enough-password" },
      "203.0.113.1",
      dependencies,
    ),
    { status: "invalid-token" },
  );
  assert.deepEqual(calls, [
    "rate-limit",
    "find-token",
    "hash-password",
    "atomic-consume",
  ]);
});
