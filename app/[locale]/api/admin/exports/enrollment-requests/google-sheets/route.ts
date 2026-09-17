import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { isAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { writeRowsToGoogleSheet } from "@/lib/google-sheets";

const allowedStatuses = [
  "ALL",
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const;

type RequestStatusFilter =
  (typeof allowedStatuses)[number];

export async function GET(request: Request) {
  try {
    const session = await getAuthSession();

    if (!isAdminSession(session)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const requestedStatus = url.searchParams
      .get("status")
      ?.toUpperCase();

    const status: RequestStatusFilter =
      allowedStatuses.includes(
        requestedStatus as RequestStatusFilter,
      )
        ? (requestedStatus as RequestStatusFilter)
        : "ALL";

    const requests =
      await prisma.enrollmentRequest.findMany({
        where:
          status === "ALL"
            ? undefined
            : { status },
        select: {
          id: true,
          fullName: true,
          email: true,
          transferWalletNumber: true,
          personalPhoneNumber: true,
          courseName: true,
          coursePrice: true,
          currency: true,
          status: true,
          adminNotes: true,
          reviewedAt: true,
          createdAt: true,
          updatedAt: true,
          course: {
            select: {
              titleAr: true,
              titleEn: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    const rows = requests.map((request) => ({
      id: request.id,
      fullName: request.fullName,
      email: request.email,
      transferWalletNumber:
        request.transferWalletNumber,
      personalPhoneNumber:
        request.personalPhoneNumber,
      courseName: request.courseName,
      courseArabic: request.course.titleAr,
      courseEnglish: request.course.titleEn,
      coursePrice: request.coursePrice.toString(),
      currency: request.currency,
      status: request.status,
      adminNotes: request.adminNotes ?? "",
      submittedAt: request.createdAt,
      reviewedAt: request.reviewedAt,
      updatedAt: request.updatedAt,
    }));

    const columns = [
      { key: "id", header: "Request ID" },
      { key: "fullName", header: "Full Name" },
      { key: "email", header: "Email" },
      {
        key: "transferWalletNumber",
        header: "Transfer Wallet",
      },
      {
        key: "personalPhoneNumber",
        header: "Phone",
      },
      { key: "courseName", header: "Course Name" },
      {
        key: "courseArabic",
        header: "Course (Arabic)",
      },
      {
        key: "courseEnglish",
        header: "Course (English)",
      },
      {
        key: "coursePrice",
        header: "Course Price",
      },
      { key: "currency", header: "Currency" },
      { key: "status", header: "Status" },
      {
        key: "adminNotes",
        header: "Admin Notes",
      },
      {
        key: "submittedAt",
        header: "Submitted At",
      },
      {
        key: "reviewedAt",
        header: "Reviewed At",
      },
      {
        key: "updatedAt",
        header: "Updated At",
      },
    ] as const;

    const result = await writeRowsToGoogleSheet({
      sheetName: "Enrollment Requests",
      columns,
      rows,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Enrollment requests exported to Google Sheets successfully.",
        ...result,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Google Sheets enrollment requests export failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to export enrollment requests to Google Sheets.",
      },
      { status: 500 },
    );
  }
}