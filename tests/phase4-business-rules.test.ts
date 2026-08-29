import test from "node:test";
import assert from "node:assert/strict";

import {
  canCreateEnrollmentForCourse,
  computePaymentAmount,
  ensureEnrollmentAccess,
  ensurePaymentAmountIsTrusted,
} from "../lib/services/enrollment-access";

test("student cannot create enrollment for unpublished course", () => {
  const result = canCreateEnrollmentForCourse({
    courseStatus: "DRAFT",
    hasActiveEnrollment: false,
    userId: "student-1",
    courseId: "course-1",
  });

  assert.equal(result.allowed, false);
  assert.match(result.reason, /published/i);
});

test("student cannot create duplicate active enrollment", () => {
  const result = canCreateEnrollmentForCourse({
    courseStatus: "PUBLISHED",
    hasActiveEnrollment: true,
    userId: "student-1",
    courseId: "course-1",
  });

  assert.equal(result.allowed, false);
  assert.match(result.reason, /already enrolled|active/i);
});

test("payment amount comes from the course price on the server", () => {
  assert.equal(computePaymentAmount({ coursePrice: 299.99, submittedAmount: 1 }), 299.99);
  assert.equal(ensurePaymentAmountIsTrusted({ coursePrice: 149, submittedAmount: 149 }), 149);
});

test("active enrollment grants course access", () => {
  const status = ensureEnrollmentAccess({ enrollmentStatus: "ACTIVE" });
  assert.equal(status.allowed, true);
});

test("non-active enrollment denies course access", () => {
  const status = ensureEnrollmentAccess({ enrollmentStatus: "PENDING" });
  assert.equal(status.allowed, false);
});
