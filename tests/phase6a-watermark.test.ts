
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = join(process.cwd());

const protectedPageSource = readFileSync(
  join(
    projectRoot,
    "app/[locale]/dashboard/courses/[courseId]/page.tsx",
  ),
  "utf8",
);

const mobilePlaybackRoute = readFileSync(
  join(
    projectRoot,
    "app/api/mobile/lessons/[lessonId]/playback/route.ts",
  ),
  "utf8",
);

const publicPageSource = readFileSync(
  join(projectRoot, "app/[locale]/courses/[slug]/page.tsx"),
  "utf8",
);

const watermarkHelperSource = readFileSync(
  join(projectRoot, "lib/watermark.ts"),
  "utf8",
);

test("Android playback receives a short opaque watermark identifier", () => {
  assert.match(
    mobilePlaybackRoute,
    /getStudentWatermarkId\(auth\.userId\)/,
  );

  assert.match(
    watermarkHelperSource,
    /createHash\("sha256"\)\.update\(userId\)\.digest\("hex"\)\.slice\(0,\s*10\)\.toUpperCase\(\)/,
  );

  assert.match(mobilePlaybackRoute, /watermarkId/);
});

test("web course player directs students to the Android app", () => {
  assert.match(
    protectedPageSource,
    /Lesson playback is available through the Android app only/,
  );

  assert.doesNotMatch(
    protectedPageSource,
    /getStudentWatermarkId|watermarkId=\{watermarkId\}/,
  );
});

test("public course pages do not expose the watermark flow", () => {
  assert.doesNotMatch(
    publicPageSource,
    /getStudentWatermarkId|createHash/,
  );
});
