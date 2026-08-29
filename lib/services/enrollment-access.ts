export type CourseAccessCheckInput = {
  enrollmentStatus?: string | null;
  hasActiveEnrollment?: boolean;
  courseStatus?: string | null;
  userId?: string | null;
  courseId?: string | null;
  submittedAmount?: number | string | null;
  coursePrice?: number | string | null;
};

export function ensureEnrollmentAccess(input: CourseAccessCheckInput) {
  const hasActive = input.enrollmentStatus === "ACTIVE" || Boolean(input.hasActiveEnrollment);

  return {
    allowed: hasActive,
    reason: hasActive ? "Course access granted." : "Active enrollment required.",
  };
}

export function canCreateEnrollmentForCourse(input: CourseAccessCheckInput) {
  if (input.courseStatus !== "PUBLISHED") {
    return { allowed: false, reason: "Course must be published before enrollment." };
  }

  if (input.hasActiveEnrollment) {
    return { allowed: false, reason: "You already have an active enrollment for this course." };
  }

  return { allowed: true, reason: "Enrollment allowed." };
}

export function computePaymentAmount(input: CourseAccessCheckInput) {
  const coursePrice = Number(input.coursePrice ?? 0);
  const submittedAmount = Number(input.submittedAmount ?? coursePrice);

  if (Number.isFinite(coursePrice) && coursePrice > 0) {
    return coursePrice;
  }

  return submittedAmount;
}

export function ensurePaymentAmountIsTrusted(input: CourseAccessCheckInput) {
  const coursePrice = Number(input.coursePrice ?? 0);
  return Number.isFinite(coursePrice) ? coursePrice : Number(input.submittedAmount ?? 0);
}
