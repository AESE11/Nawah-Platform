import test from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";

import { evaluateLessonAccess } from "../services/video-access";



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