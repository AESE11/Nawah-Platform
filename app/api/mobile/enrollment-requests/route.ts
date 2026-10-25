import { NextResponse } from "next/server";
import { getMobileAuth } from "@/lib/mobile/auth";
import { prisma } from "@/lib/prisma";
import { getActiveEnrollmentForCourse } from "@/lib/services/enrollment-service";
import { getPaymentMethods } from "@/lib/services/payment-service";
import { uploadEnrollmentReceipt } from "@/lib/cloudinary";
import { enrollmentRequestSchema } from "@/lib/validation/payment";

const MAX_RECEIPT_SIZE = 2 * 1024 * 1024;

function textValue(value: FormDataEntryValue | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}


export async function GET(request: Request) {
  try {
    const auth = await getMobileAuth(request);

    if (!auth) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 },
      );
    }

    if (auth.role !== "STUDENT") {
      return NextResponse.json(
        { message: "Student access required." },
        { status: 403 },
      );
    }

    const requests = await prisma.enrollmentRequest.findMany({
      where: {
        userId: auth.userId,
      },
      select: {
        id: true,
        courseId: true,
        courseName: true,
        coursePrice: true,
        currency: true,
        status: true,
        adminNotes: true,
        createdAt: true,
        reviewedAt: true,
        course: {
          select: {
            titleAr: true,
            thumbnailUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      requests: requests.map((item) => ({
        id: item.id,
        courseId: item.courseId,
        courseName: item.course.titleAr || item.courseName,
        coursePrice: item.coursePrice.toString(),
        currency: item.currency,
        status: item.status,
        adminNotes: item.adminNotes,
        createdAt: item.createdAt,
        reviewedAt: item.reviewedAt,
        thumbnailUrl: item.course.thumbnailUrl,
      })),
    });
  } catch (error) {
    console.error("Mobile enrollment requests lookup failed:", error);

    return NextResponse.json(
      { message: "Failed to load enrollment requests." },
      { status: 500 },
    );
  }
}


export async function POST(request: Request) {
  try {
    // 1. Authenticate Android user
    const auth = await getMobileAuth(request);

    if (!auth) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 },
      );
    }

    if (auth.role !== "STUDENT") {
      return NextResponse.json(
        { message: "Student access required." },
        { status: 403 },
      );
    }

    // 2. Read multipart form data
    const formData = await request.formData();

    const parsed = enrollmentRequestSchema.safeParse({
      courseId: textValue(formData.get("courseId")),
      fullName: textValue(formData.get("fullName")),
      email: textValue(formData.get("email")),
      transferWalletNumber: textValue(formData.get("transferWalletNumber")),
      personalPhoneNumber: textValue(formData.get("personalPhoneNumber")),
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          message:
            parsed.error.issues[0]?.message ??
            "Please complete all required fields correctly.",
        },
        { status: 400 },
      );
    }

    // 3. Verify email belongs to the authenticated account
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user || user.role !== "STUDENT") {
      return NextResponse.json(
        { message: "Student account was not found." },
        { status: 401 },
      );
    }

    if (
      !user.email ||
      parsed.data.email.toLowerCase() !== user.email.toLowerCase()
    ) {
      return NextResponse.json(
        { message: "Use the email address associated with your account." },
        { status: 400 },
      );
    }

    // 4. Validate receipt
    const receipt = formData.get("receipt");

    if (!(receipt instanceof File) || receipt.size === 0) {
      return NextResponse.json(
        { message: "A payment receipt is required." },
        { status: 400 },
      );
    }

    if (receipt.size > MAX_RECEIPT_SIZE) {
      return NextResponse.json(
        { message: "Receipt image must not exceed 2 MB." },
        { status: 400 },
      );
    }

    // 5. Verify course
    const course = await prisma.course.findUnique({
      where: { id: parsed.data.courseId },
    });

    if (!course || course.status !== "PUBLISHED") {
      return NextResponse.json(
        { message: "This course is not available for enrollment." },
        { status: 404 },
      );
    }

    // 6. Prevent duplicate active enrollment
    const activeEnrollment = await getActiveEnrollmentForCourse(
      auth.userId,
      course.id,
    );

    if (activeEnrollment) {
      return NextResponse.json(
        { message: "You are already enrolled in this course." },
        { status: 409 },
      );
    }

    // 7. Prevent duplicate pending request
    const pendingRequest = await prisma.enrollmentRequest.findFirst({
      where: {
        userId: auth.userId,
        courseId: course.id,
        status: "PENDING",
      },
    });

    if (pendingRequest) {
      return NextResponse.json(
        { message: "Your enrollment request is already under review." },
        { status: 409 },
      );
    }

    // 8. Use the first enabled payment method,
    // matching the existing web enrollment flow.
    const paymentMethods = await getPaymentMethods();
    const paymentMethod = paymentMethods[0];

    if (!paymentMethod) {
      return NextResponse.json(
        { message: "No enabled payment method is currently available." },
        { status: 503 },
      );
    }

    // 9. Upload receipt to Cloudinary
    const uploadedReceipt = await uploadEnrollmentReceipt(receipt);

    // 10. Create Payment + EnrollmentRequest atomically
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          userId: auth.userId,
          courseId: course.id,
          amount: course.price,
          currency: "EGP",
          paymentMethodId: paymentMethod.id,
          status: "PENDING",
          proofUrl: uploadedReceipt.secure_url,
          proofPublicId: uploadedReceipt.public_id,
        },
      });

      const enrollmentRequest = await tx.enrollmentRequest.create({
        data: {
          userId: auth.userId,
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

      return {
        paymentId: payment.id,
        enrollmentRequestId: enrollmentRequest.id,
      };
    });

    return NextResponse.json(
      {
        message:
          "Your enrollment request was submitted successfully and will be reviewed by the administration.",
        paymentId: result.paymentId,
        enrollmentRequestId: result.enrollmentRequestId,
        status: "PENDING",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Mobile enrollment request failed:", error);

    return NextResponse.json(
      { message: "The enrollment request could not be submitted." },
      { status: 500 },
    );
  }
}