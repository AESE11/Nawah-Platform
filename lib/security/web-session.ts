import { isPasswordAuthVersionCurrent } from "./password-auth-version";

type UserRole = "STUDENT" | "ADMIN";

type WebSessionClaims = {
  sub?: unknown;
  role?: unknown;
  passwordAuthVersion?: unknown;
};

type CurrentUserAuth = {
  role: UserRole;
  passwordHash: string;
} | null;

export function isWebSessionCurrent(
  token: WebSessionClaims,
  user: CurrentUserAuth,
  secret: string,
): boolean {
  if (
    typeof token.sub !== "string" ||
    !token.sub ||
    (token.role !== "STUDENT" && token.role !== "ADMIN") ||
    !user ||
    user.role !== token.role
  ) {
    return false;
  }

  return isPasswordAuthVersionCurrent(
    token.passwordAuthVersion,
    user.passwordHash,
    secret,
  );
}
