import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ensureEnrollmentAccess } from "../lib/services/enrollment-access";

const projectRoot = join(process.cwd());
const managementActions = readFileSync(join(projectRoot, "lib/actions/enrollment-management-actions.ts"), "utf8");
const studentsPage = readFileSync(join(projectRoot, "app/[locale]/admin/students/page.tsx"), "utf8");
const studentDetailsPage = readFileSync(join(projectRoot, "app/[locale]/admin/students/[userId]/page.tsx"), "utf8");
const tokenRoute = readFileSync(
  join(projectRoot, "app/[locale]/api/video/[lessonId]/token/route.ts"),
  "utf8",
);

const mobilePlaybackRoute = readFileSync(
  join(projectRoot, "app/api/mobile/lessons/[lessonId]/playback/route.ts"),
  "utf8",
);
const coursePlayerPage = readFileSync(join(projectRoot, "app/[locale]/dashboard/courses/[courseId]/page.tsx"), "utf8");
const schema = readFileSync(join(projectRoot, "prisma/schema.prisma"), "utf8");

test("disabled enrollment is denied by the shared access check", () => {
  assert.equal(ensureEnrollmentAccess({ enrollmentStatus: "SUSPENDED" }).allowed, false);
  assert.equal(ensureEnrollmentAccess({ enrollmentStatus: "ACTIVE" }).allowed, true);
});

test("admin management actions require admin sessions and conditional transitions", () => {
  assert.match(managementActions, /session\?\.user\?\.role === "ADMIN"/);
  assert.match(managementActions, /status: "ACTIVE"/);
  assert.match(managementActions, /status: "SUSPENDED"/);
  assert.match(managementActions, /updateMany/);
});

test("student management surfaces are scoped to students and safe fields", () => {
  assert.match(studentsPage, /where: \{ role: "STUDENT" \}/);
  assert.match(studentDetailsPage, /role: "STUDENT"/);
  assert.doesNotMatch(studentsPage, /passwordHash|access_token|refresh_token/);
  assert.doesNotMatch(studentDetailsPage, /passwordHash|access_token|refresh_token/);
});

test("protected course and token paths require active enrollment", () => {
  assert.match(coursePlayerPage, /getActiveEnrollmentForCourse/);
  assert.match(mobilePlaybackRoute, /getActiveEnrollmentForCourse/);
  assert.match(tokenRoute, /APP_ONLY_PLAYBACK/);
  assert.match(tokenRoute, /status: 403/);
  assert.match(schema, /SUSPENDED/);
  assert.match(schema, /@@unique\(\[userId, courseId\]\)/);
});
