import { SignJWT, jwtVerify } from "jose";

const MOBILE_TOKEN_ISSUER = "arabic-course-platform";
const MOBILE_TOKEN_AUDIENCE = "android-app";
const MOBILE_TOKEN_EXPIRY = "7d";

function getMobileAuthSecret() {
  const secret = process.env.MOBILE_AUTH_SECRET;

  if (!secret) {
    throw new Error("MOBILE_AUTH_SECRET is not configured.");
  }

  return new TextEncoder().encode(secret);
}

export type MobileTokenPayload = {
  userId: string;
  role: "STUDENT" | "ADMIN";
};

export async function createMobileAuthToken(
  payload: MobileTokenPayload,
) {
  return new SignJWT({
    role: payload.role,
    type: "mobile",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.userId)
    .setIssuer(MOBILE_TOKEN_ISSUER)
    .setAudience(MOBILE_TOKEN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(MOBILE_TOKEN_EXPIRY)
    .sign(getMobileAuthSecret());
}

export async function verifyMobileAuthToken(token: string) {
  const { payload } = await jwtVerify(
    token,
    getMobileAuthSecret(),
    {
      issuer: MOBILE_TOKEN_ISSUER,
      audience: MOBILE_TOKEN_AUDIENCE,
    },
  );

  if (
    payload.type !== "mobile" ||
    typeof payload.sub !== "string" ||
    (payload.role !== "STUDENT" && payload.role !== "ADMIN")
  ) {
    throw new Error("Invalid mobile authentication token.");
  }

  return {
    userId: payload.sub,
    role: payload.role,
  } satisfies MobileTokenPayload;
}