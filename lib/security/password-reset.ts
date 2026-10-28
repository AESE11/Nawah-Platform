import { createHash, randomBytes } from "node:crypto";

export const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;

export function createPasswordResetToken() {
  const token = randomBytes(32).toString("base64url");

  const tokenHash = createHash("sha256")
    .update(token)
    .digest("hex");

  return {
    token,
    tokenHash,
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
  };
}

export function hashPasswordResetToken(token: string): string {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

export function isPasswordResetTokenValid(
  token: { usedAt: Date | null; expiresAt: Date },
  now: Date = new Date(),
): boolean {
  return token.usedAt === null && token.expiresAt.getTime() > now.getTime();
}
