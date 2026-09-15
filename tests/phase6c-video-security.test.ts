import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  DEFAULT_MUX_PLAYBACK_TOKEN_TTL,
  getMuxPlaybackTokenLifetimeMs,
  getMuxPlaybackTokenTtl,
  normalizeMuxPlaybackTokenTtl,
} from "../lib/mux";
import { checkVideoTokenRateLimit, resetVideoTokenRateLimitsForTests } from "../lib/security/video-token-rate-limit";

const projectRoot = join(process.cwd());
const tokenRoute = readFileSync(join(projectRoot, "app/[locale]/api/video/[lessonId]/token/route.ts"), "utf8");
const securityLog = readFileSync(join(projectRoot, "lib/security/video-security-log.ts"), "utf8");
const playerSource = readFileSync(join(projectRoot, "components/video/mux-video-player.tsx"), "utf8");
const publicCoursePage = readFileSync(join(projectRoot, "app/[locale]/courses/[slug]/page.tsx"), "utf8");
const nextConfig = readFileSync(join(projectRoot, "next.config.ts"), "utf8");

test("playback token lifetime is configurable within safe bounds", () => {
  const originalTtl = process.env.MUX_PLAYBACK_TOKEN_TTL;
  process.env.MUX_PLAYBACK_TOKEN_TTL = "15m";
  assert.equal(getMuxPlaybackTokenTtl(), "15m");
  assert.equal(getMuxPlaybackTokenLifetimeMs(), 15 * 60 * 1000);

  assert.equal(normalizeMuxPlaybackTokenTtl("4m"), DEFAULT_MUX_PLAYBACK_TOKEN_TTL);
  assert.equal(normalizeMuxPlaybackTokenTtl("25h"), DEFAULT_MUX_PLAYBACK_TOKEN_TTL);
  assert.equal(normalizeMuxPlaybackTokenTtl("not-a-duration"), DEFAULT_MUX_PLAYBACK_TOKEN_TTL);

  if (originalTtl === undefined) {
    delete process.env.MUX_PLAYBACK_TOKEN_TTL;
  } else {
    process.env.MUX_PLAYBACK_TOKEN_TTL = originalTtl;
  }
});

test("token issuance is rate limited per authenticated user without affecting Mux delivery", () => {
  resetVideoTokenRateLimitsForTests();
  const now = 1_000_000;

  for (let request = 0; request < 10; request += 1) {
    assert.equal(checkVideoTokenRateLimit("student-1", now).allowed, true);
  }

  const limited = checkVideoTokenRateLimit("student-1", now);
  assert.equal(limited.allowed, false);
  assert.ok(limited.retryAfterSeconds > 0);
  assert.equal(checkVideoTokenRateLimit("student-2", now).allowed, true);
  assert.match(tokenRoute, /status: 429/);
  assert.doesNotMatch(tokenRoute, /stream\.mux\.com/);
});

test("token endpoint retains server-side student enrollment authorization", () => {
  assert.match(tokenRoute, /getAuthSession/);
  assert.match(tokenRoute, /session\.user\.role !== "STUDENT"/);
  assert.match(tokenRoute, /getActiveEnrollmentForCourse\(session\.user\.id, lesson\.chapter\.courseId\)/);
  assert.match(tokenRoute, /generateMuxPlaybackToken\(playbackId\)/);
  assert.doesNotMatch(tokenRoute, /expiration:\s*"1h"/);
  assert.match(tokenRoute, /Cache-Control.*no-store/);
});

test("video security logs use an allow-list and never include credentials", () => {
  assert.match(securityLog, /event: VideoSecurityEvent/);
  assert.match(securityLog, /userId\?: string/);
  assert.match(securityLog, /lessonId\?: string/);
  assert.doesNotMatch(securityLog, /playbackToken|jwt|cookie|authorization|private.?key|password/i);
});

test("embedding protections allow the required Mux and Cloudinary hosts", () => {
  assert.match(nextConfig, /frame-ancestors 'self'/);
  assert.match(nextConfig, /X-Frame-Options/);
  assert.match(nextConfig, /https:\/\/\*\.mux\.com/);
  assert.match(nextConfig, /https:\/\/res\.cloudinary\.com/);
});

test("public pages keep playback identifiers private and the Phase 6A watermark remains client-safe", () => {
  assert.doesNotMatch(publicCoursePage, /muxPlaybackId|playbackId/i);
  assert.match(playerSource, /ID-\{watermarkId\}/);
  assert.doesNotMatch(playerSource, /MUX_SIGNING_KEY|MUX_PRIVATE_KEY|NEXT_PUBLIC_MUX_/i);
});
