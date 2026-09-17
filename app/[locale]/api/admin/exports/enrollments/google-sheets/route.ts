import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { isAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { writeRowsToGoogleSheet } from "@/lib/google-sheets";

const allowedStatuses = ["ALL", "ACTIVE", "SUSPENDED"] as const;

type EnrollmentStatusFilter =
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

    const status: EnrollmentStatusFilter =
      allowedStatuses.includes(
        requestedStatus as EnrollmentStatusFilter,
      )
        ? (requestedStatus as EnrollmentStatusFilter)
        : "ALL";

    const enrollments = await prisma.enrollment.findMany({
      where:
        status === "ALL"
          ? undefined
          : { status },
      select: {
        id: true,
        status: true,
        enrolledAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
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

    const rows = enrollments.map((enrollment) => ({
      id: enrollment.id,
      studentName: enrollment.user.name ?? "",
      studentEmail: enrollment.user.email,
      courseArabic: enrollment.course.titleAr,
      courseEnglish: enrollment.course.titleEn,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      expiresAt: enrollment.expiresAt,
      createdAt: enrollment.createdAt,
      updatedAt: enrollment.updatedAt,
    }));

    const columns = [
      { key: "id", header: "Enrollment ID" },
      { key: "studentName", header: "Student Name" },
      { key: "studentEmail", header: "Student Email" },
      { key: "courseArabic", header: "Course (Arabic)" },
      { key: "courseEnglish", header: "Course (English)" },
      { key: "status", header: "Status" },
      { key: "enrolledAt", header: "Enrolled At" },
      { key: "expiresAt", header: "Expires At" },
      { key: "createdAt", header: "Created At" },
      { key: "updatedAt", header: "Updated At" },
    ] as const;

    const result = await writeRowsToGoogleSheet({
      sheetName: "Enrollments",
      columns,
      rows,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Enrollments exported to Google Sheets successfully.",
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
      "Google Sheets enrollments export failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to export enrollments to Google Sheets.",
      },
      { status: 500 },
    );
  }
}