import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { getStudentWatermarkId } from "../lib/watermark";

const projectRoot = join(process.cwd());
const adminStudentPage = readFileSync(join(projectRoot, "app/[locale]/admin/students/[userId]/page.tsx"), "utf8");
const copyComponent = readFileSync(join(projectRoot, "components/admin/watermark-id-copy.tsx"), "utf8");
const protectedPlayerPage = readFileSync(join(projectRoot, "app/[locale]/dashboard/courses/[courseId]/page.tsx"), "utf8");
const publicCoursePage = readFileSync(join(projectRoot, "app/[locale]/courses/[slug]/page.tsx"), "utf8");
const studentDashboard = readFileSync(join(projectRoot, "app/[locale]/dashboard/page.tsx"), "utf8");
const englishMessages = JSON.parse(readFileSync(join(projectRoot, "messages/en.json"), "utf8")) as { admin: Record<string, string> };
const arabicMessages = JSON.parse(readFileSync(join(projectRoot, "messages/ar.json"), "utf8")) as { admin: Record<string, string> };

test("admin student detail uses the exact protected-video watermark helper", () => {
  const userId = "student-watermark-test";
  const expected = createHash("sha256").update(userId).digest("hex").slice(0, 10).toUpperCase();

  assert.equal(getStudentWatermarkId(userId), expected);
  assert.match(adminStudentPage, /getStudentWatermarkId\(student\.id\)/);
  assert.match(
  protectedPlayerPage,
  /Lesson playback is available through the Android app only/,
);

const mobilePlaybackRoute = readFileSync(
  join(
    projectRoot,
    "app/api/mobile/lessons/[lessonId]/playback/route.ts",
  ),
  "utf8",
);

assert.match(
  mobilePlaybackRoute,
  /getStudentWatermarkId\(auth\.userId\)/,
);

assert.match(adminStudentPage, /getStudentWatermarkId\(student\.id\)/);
assert.match(adminStudentPage, /watermarkId=\{`ID-\$\{watermarkId\}`\}/);
});

test("watermark identifier and copy control are limited to the admin student detail UI", () => {
  assert.match(adminStudentPage, /WatermarkIdCopy/);
  assert.match(copyComponent, /navigator\.clipboard\.writeText\(watermarkId\)/);
  assert.match(copyComponent, /role="status"/);
  assert.doesNotMatch(publicCoursePage, /WatermarkIdCopy|getStudentWatermarkId|Watermark ID|معرف العلامة المائية/);
  assert.doesNotMatch(studentDashboard, /WatermarkIdCopy|getStudentWatermarkId|Watermark ID|معرف العلامة المائية/);
});

test("admin watermark UI has both localized labels", () => {
  assert.deepEqual(
    [englishMessages.admin.watermarkId, englishMessages.admin.copy, englishMessages.admin.copied, englishMessages.admin.copyFailed],
    ["Watermark ID", "Copy", "Copied", "Copy failed"],
  );
  assert.deepEqual(
    [arabicMessages.admin.watermarkId, arabicMessages.admin.copy, arabicMessages.admin.copied, arabicMessages.admin.copyFailed],
    ["معرف العلامة المائية", "نسخ", "تم النسخ", "تعذر النسخ"],
  );
});
