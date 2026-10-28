import { createPasswordResetToken } from "./password-reset";
import type { PasswordResetRecipient } from "./password-reset-request";

export type PasswordResetDeliveryDependencies = {
  baseUrl: string | undefined;
  createToken: typeof createPasswordResetToken;
  persistToken: (
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ) => Promise<void>;
  deleteToken: (tokenHash: string) => Promise<void>;
  sendEmail: (input: { to: string; resetUrl: string }) => Promise<void>;
  logError: (message: string) => void;
};

export function createPasswordResetDeliveryTask(
  user: Pick<PasswordResetRecipient, "id" | "email">,
  dependencies: PasswordResetDeliveryDependencies,
): () => Promise<void> {
  return async () => {
    let tokenHash: string | undefined;
    let stage = "initialization";

    try {
      const baseUrl = dependencies.baseUrl?.trim();

      if (!baseUrl) {
        dependencies.logError("Password reset unavailable: APP_BASE_URL is missing.");
        return;
      }

      let resetUrl: URL;
      try {
        resetUrl = new URL("/reset-password", baseUrl);

        if (
          resetUrl.protocol !== "https:" &&
          resetUrl.hostname !== "localhost"
        ) {
          throw new Error("APP_BASE_URL must use HTTPS.");
        }
      } catch {
        dependencies.logError("Password reset unavailable: APP_BASE_URL is invalid.");
        return;
      }

      const resetToken = dependencies.createToken();
      resetUrl.searchParams.set("token", resetToken.token);
      tokenHash = resetToken.tokenHash;

      stage = "persist-token";
      await dependencies.persistToken(
        user.id,
        resetToken.tokenHash,
        resetToken.expiresAt,
      );

      stage = "send-email";await dependencies.sendEmail({
        to: user.email,
        resetUrl: resetUrl.toString(),
      });
    } catch (error) {
      if (tokenHash) {
        try {
          await dependencies.deleteToken(tokenHash);
        } catch {
          dependencies.logError("Failed to clean up a password reset token.");
        }
      }

      const errorType =
        error instanceof Error ? error.name : "UnknownError";

      dependencies.logError(
        `Password reset delivery failed at ${stage} (${errorType}).`,
      );
    }
  };
}
