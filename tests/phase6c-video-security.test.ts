import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";


import {
  checkVideoTokenRateLimitWith,
  VIDEO_TOKEN_RATE_LIMIT,
  type VideoTokenRateLimiter,
} from "../lib/security/video-token-rate-limit";

const projectRoot = join(process.cwd());
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

test("video token requests are rate limited per user without network access", async () => {
  const requestsByUser = new Map<string, number>();
  const keys: string[] = [];
  const limiter: VideoTokenRateLimiter = {
    async limit(key) {
      keys.push(key);
      const count = (requestsByUser.get(key) ?? 0) + 1;
      requestsByUser.set(key, count);
      return { success: count <= VIDEO_TOKEN_RATE_LIMIT.requests, reset: 601_000 };
    },
  };
  const now = () => 1_000;

  for (let request = 0; request < 10; request += 1) {
    const result = await checkVideoTokenRateLimitWith(
      "student-1",
      limiter,
      now,
    );
    assert.equal(result.allowed, true);
  }

  const limited = await checkVideoTokenRateLimitWith(
    "student-1",
    limiter,
    now,
  );
  assert.equal(limited.allowed, false);
  assert.equal(limited.retryAfterSeconds, 600);
  assert.equal(
    (await checkVideoTokenRateLimitWith("student-2", limiter, now)).allowed,
    true,
  );
  assert.equal(keys.filter((key) => key === "student-1").length, 11);
  assert.equal(VIDEO_TOKEN_RATE_LIMIT.window, "10 m");

  const mobilePlaybackRoute = readFileSync(
    join(projectRoot, "app/api/mobile/lessons/[lessonId]/playback/route.ts"),
    "utf8",
  );
  assert.match(mobilePlaybackRoute, /await checkVideoTokenRateLimit\(auth\.userId\)/);
  assert.match(mobilePlaybackRoute, /status: 429/);
  assert.match(mobilePlaybackRoute, /status: 503/);
});

test("video token limiter errors propagate so playback fails closed", async () => {
  const limiter: VideoTokenRateLimiter = {
    async limit() {
      throw new Error("Redis unavailable");
    },
  };

  await assert.rejects(
    checkVideoTokenRateLimitWith("student-1", limiter),
    /Redis unavailable/,
  );
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
