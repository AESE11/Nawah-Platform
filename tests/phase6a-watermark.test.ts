import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = join(process.cwd());
const playerSource = readFileSync(join(projectRoot, "components/video/mux-video-player.tsx"), "utf8");
const protectedPageSource = readFileSync(join(projectRoot, "app/[locale]/dashboard/courses/[courseId]/page.tsx"), "utf8");
const publicPageSource = readFileSync(join(projectRoot, "app/[locale]/courses/[slug]/page.tsx"), "utf8");
const watermarkHelperSource = readFileSync(join(projectRoot, "lib/watermark.ts"), "utf8");

test("protected student playback receives a short opaque watermark identifier", () => {
  assert.match(protectedPageSource, /getStudentWatermarkId\(session\.user\.id\)/);
  assert.match(watermarkHelperSource, /createHash\("sha256"\)\.update\(userId\)\.digest\("hex"\)\.slice\(0, 10\)\.toUpperCase\(\)/);
  assert.match(protectedPageSource, /watermarkId=\{watermarkId\}/);
  assert.match(playerSource, /ID-\{watermarkId\}/);
  assert.doesNotMatch(playerSource, /MUX_SIGNING_KEY|MUX_PRIVATE_KEY|passwordHash|fullName|sessionToken/i);
});

test("public course pages do not expose the watermark flow", () => {
  assert.doesNotMatch(publicPageSource, /watermarkId|createHash|ID-/);
});

test("watermark movement is bounded, playback-driven, and does not intercept player controls", () => {
  assert.match(playerSource, /setInterval\([\s\S]*15000/);
  assert.match(playerSource, /!watermarkId \|\| !isPlaying/);
  assert.match(playerSource, /onPlaying=\{[\s\S]*setIsPlaying\(true\)/);
  assert.match(playerSource, /onPause=\{[\s\S]*setIsPlaying\(false\)/);
  assert.match(playerSource, /pointer-events-none/);
});

test("watermark is contained by the Mux fullscreen target", () => {
  assert.match(playerSource, /fullscreenElement=\{containerId\}/);
  assert.match(playerSource, /setAttribute\("fullscreen-element", containerId\)/);
  assert.match(playerSource, /<div id=\{containerId\}[\s\S]*<MuxPlayer[\s\S]*ID-\{watermarkId\}/);
});
