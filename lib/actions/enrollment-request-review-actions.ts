"use server";

import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enrollmentRequestReviewSchema } from "@/lib/validation/payment";

export type EnrollmentRequestReviewState = {
  status: "idle" | "success" | "error";
  message: string;
};

function normalizeText(value: FormDataEntryValue | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function isArabic(formData: FormData) {
  return normalizeText(formData.get("locale")) === "ar";
}

function message(arabic: boolean, ar: string, en: string) {
  return arabic ? ar : en;
}

async function requireAdmin() {
  const session = await getAuthSession();
  return session?.user?.role === "ADMIN" ? session.user : null;
}

export async function approveEnrollmentRequestAction(
  _previousState: EnrollmentRequestReviewState,
  formData: FormData,
): Promise<EnrollmentRequestReviewState> {
  const arabic = isArabic(formData);
  const admin = await requireAdmin();

  if (!admin) {
    return { status: "error", message: message(arabic, "غير مصرح لك بتنفيذ هذا الإجراء.", "You are not authorized to perform this action.") };
  }

  const parsed = enrollmentRequestReviewSchema.safeParse({
    requestId: normalizeText(formData.get("requestId")),
    adminNotes: normalizeText(formData.get("adminNotes")),
  });

  if (!parsed.success) {
    return { status: "error", message: message(arabic, "رقم الطلب غير صالح.", "The request ID is invalid.") };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.enrollmentRequest.updateMany({
        where: { id: parsed.data.requestId, status: "PENDING" },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          reviewedBy: admin.id,
          adminNotes: parsed.data.adminNotes || null,
        },
      });

      if (claimed.count !== 1) {
        throw new Error("REQUEST_ALREADY_PROCESSED");
      }

      const request = await tx.enrollmentRequest.findUnique({
        where: { id: parsed.data.requestId },
        select: {
          userId: true,
          courseId: true,
          paymentId: true,
        },
      });

      if (!request) {
        throw new Error("REQUEST_NOT_FOUND");
      }
      if (!request.paymentId) {
        throw new Error("PAYMENT_NOT_FOUND");
      }

     const payment = await tx.payment.findUnique({
      where: { id: request.paymentId },
      select: { id: true, status: true },
    });

     if (!payment) {
        throw new Error("PAYMENT_NOT_FOUND");
     }

     if (payment.status !== "PENDING") {
       throw new Error("PAYMENT_ALREADY_PROCESSED");
    }

     await tx.payment.update({
       where: { id: payment.id },
       data: {
         status: "APPROVED",
         adminNotes: parsed.data.adminNotes || null,
         reviewedBy: admin.id,
         reviewedAt: new Date(),
        },
      });

      const [user, course] = await Promise.all([
        tx.user.findUnique({ where: { id: request.userId }, select: { id: true } }),
        tx.course.findUnique({ where: { id: request.courseId }, select: { id: true, status: true } }),
      ]);

      if (!user || !course || course.status !== "PUBLISHED") {
        throw new Error("TARGET_NOT_VALID");
      }

      const existingEnrollment = await tx.enrollment.findUnique({
        where: { userId_courseId: { userId: request.userId, courseId: request.courseId } },
        select: { id: true, status: true },
      });

      if (!existingEnrollment) {
        await tx.enrollment.create({
          data: {
            userId: request.userId,
            courseId: request.courseId,
            status: "ACTIVE",
            enrolledAt: new Date(),
          },
        });
      } else if (existingEnrollment.status !== "ACTIVE") {
        await tx.enrollment.update({
          where: { id: existingEnrollment.id },
          data: { status: "ACTIVE", enrolledAt: new Date() },
        });
      }
    });
  } catch (error) {
    const errorCode = error instanceof Error ? error.message : "UNKNOWN";
    const errorMessage = errorCode === "REQUEST_ALREADY_PROCESSED"
      ? message(arabic, "تمت معالجة هذا الطلب مسبقًا.", "This request has already been processed.")
      : errorCode === "REQUEST_NOT_FOUND"
        ? message(arabic, "الطلب غير موجود.", "Request not found.")
        : errorCode === "PAYMENT_NOT_FOUND"
          ? message(
              arabic,
              "لا يوجد دفع مرتبط بهذا الطلب.",
              "No payment is linked to this request.",
            )
          : errorCode === "PAYMENT_ALREADY_PROCESSED"
            ? message(
                arabic,
                "تمت معالجة الدفع المرتبط بهذا الطلب بالفعل.",
                "The payment linked to this request has already been processed.",
              )
            : errorCode === "TARGET_NOT_VALID"
              ? message(arabic, "المستخدم أو الدورة غير صالحين للتسجيل.", "The user or course is no longer valid for enrollment.")
              : message(arabic, "تعذر الموافقة على الطلب.", "Could not approve the request.");

    return { status: "error", message: errorMessage };
  }

  const locale = normalizeText(formData.get("locale"));

revalidatePath(`/${locale}/admin/enrollment-requests`);
revalidatePath(`/${locale}/admin/payments`);
revalidatePath(`/${locale}/admin`);
revalidatePath(`/${locale}/dashboard`);
  return { status: "success", message: message(arabic, "تمت الموافقة وتفعيل الاشتراك.", "Request approved and enrollment activated.") };
}

export async function rejectEnrollmentRequestAction(
  _previousState: EnrollmentRequestReviewState,
  formData: FormData,
): Promise<EnrollmentRequestReviewState> {
  const arabic = isArabic(formData);
  const admin = await requireAdmin();

  if (!admin) {
    return { status: "error", message: message(arabic, "غير مصرح لك بتنفيذ هذا الإجراء.", "You are not authorized to perform this action.") };
  }

  const parsed = enrollmentRequestReviewSchema.safeParse({
    requestId: normalizeText(formData.get("requestId")),
    adminNotes: normalizeText(formData.get("adminNotes")),
  });

  if (!parsed.success) {
    return { status: "error", message: message(arabic, "رقم الطلب غير صالح.", "The request ID is invalid.") };
  }

  if (!parsed.data.adminNotes) {
    return { status: "error", message: message(arabic, "يرجى إدخال سبب الرفض.", "A rejection reason is required.") };
  }

  try {
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.enrollmentRequest.updateMany({
      where: { id: parsed.data.requestId, status: "PENDING" },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedBy: admin.id,
        adminNotes: parsed.data.adminNotes || null,
      },
    });

    if (claimed.count !== 1) {
      throw new Error("REQUEST_ALREADY_PROCESSED");
    }

    const request = await tx.enrollmentRequest.findUnique({
      where: { id: parsed.data.requestId },
      select: {
        paymentId: true,
      },
    });

    if (!request) {
      throw new Error("REQUEST_NOT_FOUND");
    }

    if (!request.paymentId) {
      throw new Error("PAYMENT_NOT_FOUND");
    }

    const payment = await tx.payment.findUnique({
      where: { id: request.paymentId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!payment) {
      throw new Error("PAYMENT_NOT_FOUND");
    }

    if (payment.status !== "PENDING") {
      throw new Error("PAYMENT_ALREADY_PROCESSED");
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "REJECTED",
        adminNotes: parsed.data.adminNotes,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
    });
  });
} catch (error) {
  const errorCode = error instanceof Error ? error.message : "UNKNOWN";

  const errorMessage =
    errorCode === "REQUEST_ALREADY_PROCESSED"
      ? message(
          arabic,
          "طھظ…طھ ظ…ط¹ط§ظ„ط¬ط© ظ‡ط°ط§ ط§ظ„ط·ظ„ط¨ ظ…ط³ط¨ظ‚ظ‹ط§.",
          "This request has already been processed.",
        )
      : errorCode === "REQUEST_NOT_FOUND"
        ? message(
            arabic,
            "ط§ظ„ط·ظ„ط¨ ط؛ظٹط± ظ…ظˆط¬ظˆط¯.",
            "Request not found.",
          )
        : errorCode === "PAYMENT_NOT_FOUND"
          ? message(
              arabic,
              "لا يوجد دفع مرتبط بهذا الطلب.",
              "No payment is linked to this request.",
            )
          : errorCode === "PAYMENT_ALREADY_PROCESSED"
            ? message(
                arabic,
                "تمت معالجة الدفع المرتبط بهذا الطلب بالفعل.",
                "The payment linked to this request has already been processed.",
              )
            : message(
                arabic,
                "طھط¹ط°ط± ط±ظپط¶ ط·ظ„ط¨ ط§ظ„ط§ط´طھط±ط§ظƒ.",
                "Could not reject the request.",
              );

  return { status: "error", message: errorMessage };
}

  const locale = normalizeText(formData.get("locale"));

revalidatePath(`/${locale}/admin/enrollment-requests`);
revalidatePath(`/${locale}/admin/payments`);
revalidatePath(`/${locale}/admin`);
revalidatePath(`/${locale}/dashboard`);
  return { status: "success", message: message(arabic, "تم رفض طلب الاشتراك.", "Request rejected.") };
}