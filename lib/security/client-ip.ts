
type ClientIpRuntime = {
  NODE_ENV?: string;
  VERCEL?: string;
  NAWAH_LOCAL_LOOPBACK_IP?: string;
};

export function getClientIp(request: Pick<Request, "headers">): string | null {
  return getClientIpFromHeaders(request.headers);
}

export function getClientIpFromHeaders(
  headers: Headers | Record<string, string | string[] | undefined> | undefined,
  runtime: ClientIpRuntime = process.env,
): string | null {
  if (
    runtime.VERCEL !== "1" &&
    (runtime.NODE_ENV === "development" ||
      (runtime.NODE_ENV === "production" &&
        runtime.NAWAH_LOCAL_LOOPBACK_IP === "1"))
  ) {
    return "127.0.0.1";
  }

  if (runtime.VERCEL === "1" && headers) {
    const header = headers instanceof Headers
      ? headers.get("x-vercel-forwarded-for")
      : headers["x-vercel-forwarded-for"];
    const vercelIp = Array.isArray(header) ? header[0] : header;
    const ip = vercelIp?.split(",")[0]?.trim();

    if (ip && ip.length <= 45) {
      return ip;
    }
  }

  // Fail closed if no trusted client IP is available.
  return null;
}
