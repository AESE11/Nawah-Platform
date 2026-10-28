import { createHmac, timingSafeEqual } from "node:crypto";

export function createPasswordAuthVersion(
  passwordHash: string,
  secret: string,
): string {
  if (!secret) {
    throw new Error("Authentication secret is not configured.");
  }

  return createHmac("sha256", secret)
    .update("password-auth-version:v1\0")
    .update(passwordHash)
    .digest("base64url");
}

export function isPasswordAuthVersionCurrent(
  authVersion: unknown,
  passwordHash: string,
  secret: string,
): boolean {
  if (typeof authVersion !== "string" || !secret) {
    return false;
  }

  const actual = Buffer.from(authVersion);
  const expected = Buffer.from(createPasswordAuthVersion(passwordHash, secret));

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
