"use server";

import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/lib/auth";
import { cloudinaryConfigured, uploadEnrollmentReceipt } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { getActiveEnrollmentForCourse } from "@/lib/services/enrollment-service";
import { getPaymentMethods } from "@/lib/services/payment-service";
import { enrollmentRequestSchema } from "@/lib/validation/payment";

export type EnrollmentRequestActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

function normalizeText(value: FormDataEntryValue | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export async function createEnrollmentRequestAction(
  _previousState: EnrollmentRequestActionState,
  formData: FormData,
): Promise<EnrollmentRequestActionState> {
  const session = await getAuthSession();
  const isArabic = normalizeText(formData.get("locale")) === "ar";

  if (!session?.user || session.user.role !== "STUDENT") {
    return {
      status: "error",
      message: isArabic
        ? "Please log in as a student to submit an enrollment request."
        : "Please log in as a student to submit an enrollment request.",
    };
  }

  const parsed = enrollmentRequestSchema.safeParse({
    courseId: normalizeText(formData.get("courseId")),
    fullName: normalizeText(formData.get("fullName")),
    email: normalizeText(formData.get("email")),
    transferWalletNumber: normalizeText(formData.get("transferWalletNumber")),
    personalPhoneNumber: normalizeText(formData.get("personalPhoneNumber")),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: isArabic
        ? "Please complete all required fields correctly."
        : parsed.error.issues[0]?.message ?? "Please complete all required fields.",
    };
  }

  if (
    !session.user.email ||
    parsed.data.email.toLowerCase() !== session.user.email.toLowerCase()
  ) {
    return {
      status: "error",
      message: isArabic
        ? "Use the email address associated with your account."
        : "Use the email address associated with your account.",
    };
  }

  const receipt = formData.get("receipt");

  if (!(receipt instanceof File) || receipt.size === 0) {
    return {
      status: "error",
      message: isArabic
        ? "A payment receipt is required."
        : "A payment receipt is required.",
    };
  }

  const course = await prisma.course.findUnique({
    where: { id: parsed.data.courseId },
  });

  if (!course || course.status !== "PUBLISHED") {
    return {
      status: "error",
      message: isArabic
        ? "This course is not available for enrollment."
        : "This course is not available for enrollment.",
    };
  }

  const activeEnrollment = await getActiveEnrollmentForCourse(
    session.user.id,
    course.id,
  );

  if (activeEnrollment) {
    return {
      status: "error",
      message: isArabic
        ? "You are already enrolled in this course."
        : "You are already enrolled in this course.",
    };
  }

  const pendingRequest = await prisma.enrollmentRequest.findFirst({
    where: {
      userId: session.user.id,
      courseId: course.id,
      status: "PENDING",
    },
  });

  if (pendingRequest) {
    return {
      status: "error",
      message: isArabic
        ? "Your enrollment request is already under review."
        : "Your enrollment request is already under review.",
    };
  }

  const paymentMethods = await getPaymentMethods();
  const paymentMethod = paymentMethods[0];

  if (!paymentMethod) {
    return {
      status: "error",
      message: isArabic
        ? "No enabled payment method is currently available."
        : "No enabled payment method is currently available.",
    };
  }

  let operation = "receipt upload";

  try {
    const uploadedReceipt = await uploadEnrollmentReceipt(receipt);

    operation = "enrollment request and payment database transaction";

    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          userId: session.user.id,
          courseId: course.id,
          amount: course.price,
          currency: "EGP",
          paymentMethodId: paymentMethod.id,
          status: "PENDING",
          proofUrl: uploadedReceipt.secure_url,
          proofPublicId: uploadedReceipt.public_id,
        },
      });

      await tx.enrollmentRequest.create({
        data: {
          userId: session.user.id,
          courseId: course.id,
          paymentId: payment.id,
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          transferWalletNumber: parsed.data.transferWalletNumber,
          personalPhoneNumber: parsed.data.personalPhoneNumber,
          courseName: `${course.titleAr} / ${course.titleEn}`,
          coursePrice: course.price,
          currency: "EGP",
          receiptUrl: uploadedReceipt.secure_url,
          receiptPublicId: uploadedReceipt.public_id,
        },
      });
    });
  } catch (error) {
    console.error("[enrollment-request] submission failed", {
      operation,
      errorName: error instanceof Error ? error.name : typeof error,
      errorMessage:
        error instanceof Error ? error.message : "Unknown error",
      cloudinaryConfigured,
      cloudinaryEnvironment: {
        cloudNamePresent: Boolean(
          process.env.CLOUDINARY_CLOUD_NAME?.trim(),
        ),
        apiKeyPresent: Boolean(process.env.CLOUDINARY_API_KEY?.trim()),
        apiSecretPresent: Boolean(
          process.env.CLOUDINARY_API_SECRET?.trim(),
        ),
      },
    });

    return {
      status: "error",
      message:
        isArabic
          ? "The enrollment request could not be submitted."
          : error instanceof Error
            ? error.message
            : "The enrollment request could not be submitted.",
    };
  }

  revalidatePath(`/ar/courses/${course.slug}`);
  revalidatePath(`/en/courses/${course.slug}`);
  revalidatePath(`/ar/admin/payments`);
  revalidatePath(`/en/admin/payments`);
  revalidatePath(`/ar/admin/enrollment-requests`);
  revalidatePath(`/en/admin/enrollment-requests`);

  return {
    status: "success",
    message:
      "Your enrollment request was submitted successfully and will be reviewed by the administration.",
  };
}