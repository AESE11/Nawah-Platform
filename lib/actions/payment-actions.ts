"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentRequestSchema, paymentReviewSchema, paymentProofSchema } from "@/lib/validation/payment";
import { getPaymentMethods } from "@/lib/services/payment-service";
import { getActiveEnrollmentForCourse } from "@/lib/services/enrollment-service";

export async function requestEnrollmentAction(formData: FormData, locale: string) {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const courseId = String(formData.get("courseId") ?? "");
  const paymentMethodId = String(formData.get("paymentMethodId") ?? "");
  const notes = String(formData.get("notes") ?? "");

  const parsed = paymentRequestSchema.parse({
    courseId,
    paymentMethodId,
    transactionReference: String(formData.get("transactionReference") ?? ""),
    notes,
  });

  const course = await prisma.course.findUnique({ where: { id: parsed.courseId } });
  if (!course || course.status !== "PUBLISHED") {
    throw new Error("Course is not available for enrollment.");
  }

  const activeEnrollment = await getActiveEnrollmentForCourse(session.user.id, course.id);
  if (activeEnrollment) {
    throw new Error("You already have an active enrollment for this course.");
  }

  const paymentMethod = await prisma.paymentMethod.findUnique({ where: { id: parsed.paymentMethodId } });
  if (!paymentMethod || !paymentMethod.enabled) {
    throw new Error("Selected payment method is not available.");
  }

  const payment = await prisma.payment.create({
    data: {
      userId: session.user.id,
      courseId: course.id,
      amount: course.price,
      currency: "SAR",
      paymentMethodId: paymentMethod.id,
      status: "PENDING",
      transactionReference: parsed.transactionReference || null,
      notes: parsed.notes || null,
    },
  });

  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/dashboard/payments`);
  return payment;
}

export async function submitPaymentProofAction(formData: FormData, locale: string) {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const paymentId = String(formData.get("paymentId") ?? "");
  const parsedProof = paymentProofSchema.parse({
    proofUrl: String(formData.get("proofUrl") ?? ""),
    proofPublicId: String(formData.get("proofPublicId") ?? ""),
  });

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, userId: session.user.id },
  });

  if (!payment) {
    throw new Error("Payment request was not found.");
  }

  if (payment.status !== "PENDING") {
    throw new Error("This payment is no longer editable.");
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      proofUrl: parsedProof.proofUrl,
      proofPublicId: parsedProof.proofPublicId || null,
      status: "PENDING",
    },
  });

  revalidatePath(`/${locale}/dashboard/payments`);
  return payment.id;
}

export async function approvePaymentAction(formData: FormData, locale: string) {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  if (session.user.role !== "ADMIN") {
    throw new Error("Only admins can approve payments.");
  }

  const paymentId = String(formData.get("paymentId") ?? "");
  const parsed = paymentReviewSchema.parse({
    status: "APPROVED",
    adminNotes: String(formData.get("adminNotes") ?? ""),
  });

  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { course: true } });
  if (!payment) {
    throw new Error("Payment not found.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: parsed.status,
        adminNotes: parsed.adminNotes || null,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    });

    const existing = await tx.enrollment.findFirst({
      where: { userId: payment.userId, courseId: payment.courseId, status: "ACTIVE" },
    });

    if (existing) {
      return;
    }

    await tx.enrollment.create({
      data: {
        userId: payment.userId,
        courseId: payment.courseId,
        status: "ACTIVE",
        enrolledAt: new Date(),
      },
    });
  });

  revalidatePath(`/${locale}/admin/payments`);
  revalidatePath(`/${locale}/dashboard`);
  return paymentId;
}

export async function rejectPaymentAction(formData: FormData, locale: string) {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  if (session.user.role !== "ADMIN") {
    throw new Error("Only admins can reject payments.");
  }

  const paymentId = String(formData.get("paymentId") ?? "");
  const parsed = paymentReviewSchema.parse({
    status: "REJECTED",
    adminNotes: String(formData.get("adminNotes") ?? ""),
  });

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) {
    throw new Error("Payment not found.");
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: parsed.status,
      adminNotes: parsed.adminNotes || null,
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
    },
  });

  revalidatePath(`/${locale}/admin/payments`);
  return paymentId;
}

export async function getAvailablePaymentMethods() {
  return getPaymentMethods();
}

export async function createManualEnrollmentAction(formData: FormData, locale: string) {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  if (session.user.role !== "ADMIN") {
    throw new Error("Only admins can create manual enrollments.");
  }

  const courseId = String(formData.get("courseId") ?? "");
  const userId = String(formData.get("userId") ?? "");

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.status !== "PUBLISHED") {
    throw new Error("Only published courses can be enrolled.");
  }

  const existing = await prisma.enrollment.findFirst({
    where: { userId, courseId, status: "ACTIVE" },
  });

  if (existing) {
    throw new Error("Student already has an active enrollment for this course.");
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      userId,
      courseId,
      status: "ACTIVE",
      enrolledAt: new Date(),
    },
  });

  revalidatePath(`/${locale}/admin/enrollments`);
  return enrollment;
}
