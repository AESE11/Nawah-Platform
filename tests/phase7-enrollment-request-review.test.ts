import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { enrollmentRequestReviewSchema } from "../lib/validation/payment";

const projectRoot = join(process.cwd());
const reviewActions = readFileSync(join(projectRoot, "lib/actions/enrollment-request-review-actions.ts"), "utf8");
const schema = readFileSync(join(projectRoot, "prisma/schema.prisma"), "utf8");

test("review validation requires a request id and bounds notes", () => {
  assert.equal(enrollmentRequestReviewSchema.safeParse({ requestId: "" }).success, false);
  assert.equal(enrollmentRequestReviewSchema.safeParse({ requestId: "request-1", adminNotes: "Receipt verified." }).success, true);
  assert.equal(enrollmentRequestReviewSchema.safeParse({ requestId: "request-1", adminNotes: "x".repeat(2001) }).success, false);
});

test("review actions require an admin and claim only pending requests", () => {
  assert.match(reviewActions, /session\?\.user\?\.role === "ADMIN"/);
  assert.match(reviewActions, /where: \{ id: parsed\.data\.requestId, status: "PENDING" \}/);
  assert.match(reviewActions, /prisma\.\$transaction/);
  assert.match(reviewActions, /status: "APPROVED"/);
  assert.match(reviewActions, /status: "REJECTED"/);
});

test("approval creates an active enrollment while rejection does not", () => {
  const rejectionSection = reviewActions.slice(reviewActions.indexOf("export async function rejectEnrollmentRequestAction"));

  assert.match(reviewActions, /tx\.enrollment\.create/);
  assert.doesNotMatch(rejectionSection, /enrollment\.create/);
  assert.match(schema, /@@unique\(\[userId, courseId\]\)/);
});
