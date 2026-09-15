import { createHash } from "node:crypto";

/** Returns the opaque student identifier used by the protected video watermark. */
export function getStudentWatermarkId(userId: string) {
  return createHash("sha256").update(userId).digest("hex").slice(0, 10).toUpperCase();
}
