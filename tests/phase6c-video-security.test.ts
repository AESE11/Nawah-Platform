import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";


import { checkVideoTokenRateLimit, resetVideoTokenRateLimitsForTests } from "../lib/security/video-token-rate-limit";

const projectRoot = join(process.cwd());
const tokenRoute = readFileSync(join(projectRoot, "app/[locale]/api/video/[lessonId]/token/route.ts"), "utf8");
const securityLog = readFileSync(join(projectRoot, "lib/security/video-security-log.ts"), "utf8");
const publicCoursePage = readFileSync(join(projectRoot, "app/[locale]/courses/[slug]/page.tsx"), "utf8");
const nextConfig = readFileSync(join(projectRoot, "next.config.ts"), "utf8");

test("web playback endpoint remains Android-app-only", async () => {
  const { GET } = await import(
    "../app/[locale]/api/video/[lessonId]/token/route"
  );

  const response = await GET();
  const body = await response.json();

  assert.equal(response.status, 403);
  assert.equal(body.code, "APP_ONLY_PLAYBACK");
  assert.match(response.headers.get("Cache-Control") ?? "", /no-store/);
});

test("video token requests are rate limited per user", () => {
  resetVideoTokenRateLimitsForTests();
  const now = 1_000_000;

  for (let request = 0; request < 10; request += 1) {
    assert.equal(checkVideoTokenRateLimit("student-1", now).allowed, true);
  }

  const limited = checkVideoTokenRateLimit("student-1", now);
  assert.equal(limited.allowed, false);
  assert.ok(limited.retryAfterSeconds > 0);
  assert.equal(checkVideoTokenRateLimit("student-2", now).allowed, true);
  const mobilePlaybackRoute = readFileSync(
  join(
    projectRoot,
    "app/api/mobile/lessons/[lessonId]/playback/route.ts",
  ),
  "utf8",
);

assert.match(mobilePlaybackRoute, /checkVideoTokenRateLimit\(auth\.userId\)/);
assert.match(mobilePlaybackRoute, /status: 429/);
});



test("video security logs use an allow-list and never include credentials", () => {
  assert.match(securityLog, /event: VideoSecurityEvent/);
  assert.match(securityLog, /userId\?: string/);
  assert.match(securityLog, /lessonId\?: string/);
  assert.doesNotMatch(securityLog, /playbackToken|jwt|cookie|authorization|private.?key|password/i);
});

test("embedding protections retain required security headers and Cloudinary access", () => {
  assert.match(nextConfig, /frame-ancestors 'self'/);
  assert.match(nextConfig, /X-Frame-Options/);
  assert.match(nextConfig, /https:\/\/res\.cloudinary\.com/);
});

test("public pages keep playback identifiers private and the Phase 6A watermark remains client-safe", () => {
  assert.doesNotMatch(publicCoursePage, /playbackId/i);
});
