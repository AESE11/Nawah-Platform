import { prisma } from "@/lib/prisma";
import { SignJWT, jwtVerify } from "jose";
import {
  createPasswordAuthVersion,
  isPasswordAuthVersionCurrent,
} from "@/lib/security/password-auth-version";

const MOBILE_TOKEN_ISSUER = "arabic-course-platform";
const MOBILE_TOKEN_AUDIENCE = "android-app";
const MOBILE_TOKEN_EXPIRY = "7d";

function getMobileAuthSecret(): string {
  const secret = process.env.MOBILE_AUTH_SECRET;

  if (!secret) {
    throw new Error("MOBILE_AUTH_SECRET is not configured.");
  }

  return secret;
}

export type MobileTokenPayload = {
  userId: string;
  role: "STUDENT" | "ADMIN";
};

export async function createMobileAuthToken(
  payload: MobileTokenPayload & { passwordHash: string },
  secret = getMobileAuthSecret(),
) {
  return new SignJWT({
    role: payload.role,
    type: "mobile",
    passwordAuthVersion: createPasswordAuthVersion(
      payload.passwordHash,
      secret,
    ),
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.userId)
    .setIssuer(MOBILE_TOKEN_ISSUER)
    .setAudience(MOBILE_TOKEN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(MOBILE_TOKEN_EXPIRY)
    .sign(new TextEncoder().encode(secret));
}

export type MobileAuthUserRecord = {
  role: MobileTokenPayload["role"];
  passwordHash: string | null;
};

export async function verifyMobileAuthTokenWith(
  token: string,
  findUser: (userId: string) => Promise<MobileAuthUserRecord | null>,
  secret = getMobileAuthSecret(),
) {
  const { payload } = await jwtVerify(
    token,
    new TextEncoder().encode(secret),
    {
      issuer: MOBILE_TOKEN_ISSUER,
      audience: MOBILE_TOKEN_AUDIENCE,
    },
  );

  if (
    payload.type !== "mobile" ||
    typeof payload.sub !== "string" ||
    (payload.role !== "STUDENT" && payload.role !== "ADMIN") ||
    typeof payload.passwordAuthVersion !== "string"
  ) {
    throw new Error("Invalid mobile authentication token.");
  }

  const user = await findUser(payload.sub);

  if (
    !user?.passwordHash ||
    user.role !== payload.role ||
    !isPasswordAuthVersionCurrent(
      payload.passwordAuthVersion,
      user.passwordHash,
      secret,
    )
  ) {
    throw new Error("Invalid mobile authentication token.");
  }

  return {
    userId: payload.sub,
    role: payload.role,
  } satisfies MobileTokenPayload;
}

export async function verifyMobileAuthToken(token: string) {
  return verifyMobileAuthTokenWith(
    token,
    async (userId) => prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        passwordHash: true,
      },
    }),
  );
}