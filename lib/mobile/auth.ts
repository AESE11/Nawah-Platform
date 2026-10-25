import { verifyMobileAuthToken } from "@/lib/mobile/auth-token";

export async function getMobileAuth(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return null;
  }

  try {
    return await verifyMobileAuthToken(token);
  } catch {
    return null;
  }
}