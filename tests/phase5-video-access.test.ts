import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { evaluateLessonAccess } from "../services/video-access";
import { getMuxPlaybackTokenLifetimeMs, normalizePlaybackId } from "../lib/mux";

const projectRoot = join(process.cwd());

test("unauthenticated user cannot obtain lesson access", () => {
  const result = evaluateLessonAccess({
    userId: null,
    lessonExists: true,
    lessonCourseId: "course-a",
    courseId: "course-a",
    hasActiveEnrollment: false,
    hasPlaybackId: true,
    playbackId: "playback-123",
  });

  assert.equal(result.status, 401);
  assert.equal(result.authorized, false);
});

test("user without active enrollment is denied lesson access", () => {
  const result = evaluateLessonAccess({
    userId: "student-1",
    lessonExists: true,
    lessonCourseId: "course-a",
    courseId: "course-a",
    enrollmentStatus: "PENDING",
    hasActiveEnrollment: false,
    hasPlaybackId: true,
    playbackId: "playback-123",
  });

  assert.equal(result.status, 403);
  assert.equal(result.authorized, false);
});

test("suspended and cancelled enrollments are rejected", () => {
  const suspended = evaluateLessonAccess({
    userId: "student-1",
    lessonExists: true,
    lessonCourseId: "course-a",
    courseId: "course-a",
    enrollmentStatus: "SUSPENDED",
    hasActiveEnrollment: false,
    hasPlaybackId: true,
    playbackId: "playback-123",
  });

  const cancelled = evaluateLessonAccess({
    userId: "student-1",
    lessonExists: true,
    lessonCourseId: "course-a",
    courseId: "course-a",
    enrollmentStatus: "CANCELLED",
    hasActiveEnrollment: false,
    hasPlaybackId: true,
    playbackId: "playback-123",
  });

  assert.equal(suspended.status, 403);
  assert.equal(cancelled.status, 403);
});

test("user with active enrollment may access an owned lesson", () => {
  const result = evaluateLessonAccess({
    userId: "student-1",
    lessonExists: true,
    lessonCourseId: "course-a",
    courseId: "course-a",
    enrollmentStatus: "ACTIVE",
    hasActiveEnrollment: true,
    hasPlaybackId: true,
    playbackId: "playback-123",
  });

  assert.equal(result.authorized, true);
  assert.equal(result.status, 200);
  assert.equal(result.playbackId, "playback-123");
});

test("malicious lesson mismatch is rejected", () => {
  const result = evaluateLessonAccess({
    userId: "student-1",
    lessonExists: true,
    lessonCourseId: "course-b",
    courseId: "course-a",
    enrollmentStatus: "ACTIVE",
    hasActiveEnrollment: true,
    hasPlaybackId: true,
    playbackId: "playback-123",
  });

  assert.equal(result.authorized, false);
  assert.equal(result.status, 403);
});

test("lesson without playback id is rejected", () => {
  const result = evaluateLessonAccess({
    userId: "student-1",
    lessonExists: true,
    lessonCourseId: "course-a",
    courseId: "course-a",
    enrollmentStatus: "ACTIVE",
    hasActiveEnrollment: true,
    hasPlaybackId: false,
    playbackId: null,
  });

  assert.equal(result.status, 409);
  assert.equal(result.authorized, false);
});

test("nonexistent lesson does not authorize access", () => {
  const result = evaluateLessonAccess({
    userId: "student-1",
    lessonExists: false,
    hasActiveEnrollment: true,
    hasPlaybackId: false,
  });

  assert.equal(result.status, 404);
  assert.equal(result.authorized, false);
});

test("mux playback ttl parsing is stable and valid ids are normalized", () => {
  assert.equal(getMuxPlaybackTokenLifetimeMs("30m"), 30 * 60 * 1000);
  assert.equal(normalizePlaybackId("abc_123-XYZ"), "abc_123-XYZ");

  assert.throws(() => normalizePlaybackId(""), /valid Mux playback ID/i);
  assert.throws(() => normalizePlaybackId("bad id"), /valid Mux playback ID/i);
});

test("mux signing material stays server-side and never appears in client code", () => {
  const clientSource = readFileSync(join(projectRoot, "components/video/mux-video-player.tsx"), "utf8");
  const serverSource = readFileSync(join(projectRoot, "lib/mux.ts"), "utf8");

  assert.doesNotMatch(clientSource, /MUX_SIGNING_KEY|MUX_PRIVATE_KEY|NEXT_PUBLIC_MUX_/i);
  assert.match(serverSource, /MUX_SIGNING_KEY|MUX_PRIVATE_KEY/i);
});
