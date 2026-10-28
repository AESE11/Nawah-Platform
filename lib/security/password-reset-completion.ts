import { z } from "zod";
import {
  hashPasswordResetToken,
  isPasswordResetTokenValid,
} from "./password-reset";

const passwordResetCompletionSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  newPassword: z.string().min(8).max(128),
});

export type PasswordResetRecord = {
  id: string;
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
};

export type PasswordResetCompletionDependencies = {
  checkRateLimit: (
    ip: string,
    tokenHash: string,
  ) => Promise<{ success: boolean; retryAfter: number }>;
  findToken: (tokenHash: string) => Promise<PasswordResetRecord | null>;
  hashPassword: (password: string) => Promise<string>;
  consumeAndUpdatePassword: (
    tokenHash: string,
    passwordHash: string,
  ) => Promise<void>;
  now?: () => Date;
};

export type PasswordResetCompletionResult =
  | { status: "invalid-request" }
  | { status: "unavailable" }
  | { status: "rate-limited"; retryAfter: number }
  | { status: "invalid-token" }
  | { status: "success" };

export async function completePasswordReset(
  input: unknown,
  ip: string | null,
  dependencies: PasswordResetCompletionDependencies,
): Promise<PasswordResetCompletionResult> {
  const parsed = passwordResetCompletionSchema.safeParse(input);

  if (!parsed.success) {
    return { status: "invalid-request" };
  }

  if (!ip) {
    return { status: "unavailable" };
  }

  const { token, newPassword } = parsed.data;
  const tokenHash = hashPasswordResetToken(token);

  let rateLimit: { success: boolean; retryAfter: number };
  try {
    rateLimit = await dependencies.checkRateLimit(ip, tokenHash);
  } catch {
    return { status: "unavailable" };
  }

  if (!rateLimit.success) {
    return {
      status: "rate-limited",
      retryAfter: rateLimit.retryAfter,
    };
  }

  const resetToken = await dependencies.findToken(tokenHash);
  if (
    !resetToken ||
    !isPasswordResetTokenValid(resetToken, (dependencies.now ?? (() => new Date()))())
  ) {
    return { status: "invalid-token" };
  }

  const passwordHash = await dependencies.hashPassword(newPassword);

  try {
    await dependencies.consumeAndUpdatePassword(tokenHash, passwordHash);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVALID_OR_EXPIRED_RESET_TOKEN"
    ) {
      return { status: "invalid-token" };
    }
    throw error;
  }

  return { status: "success" };
}
