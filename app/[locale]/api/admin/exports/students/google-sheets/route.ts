import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { isAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { writeRowsToGoogleSheet } from "@/lib/google-sheets";
import { getStudentWatermarkId } from "@/lib/watermark";

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!isAdminSession(session)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        enrollmentRequests: {
          select: {
            personalPhoneNumber: true,
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        enrollments: {
          select: {
            course: {
              select: {
                titleAr: true,
                titleEn: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const rows = students.map((student) => ({
      id: student.id,
      watermarkId: `ID-${getStudentWatermarkId(student.id)}`,
      name: student.name ?? "",
      email: student.email,
      phone: student.enrollmentRequests[0]?.personalPhoneNumber ?? "",
      enrolledCourses: student.enrollments
        .map((enrollment) => enrollment.course.titleEn)
        .join(" | "),
      role: student.role,
      createdAt: student.createdAt,
      enrollmentsCount: student._count.enrollments,
    }));

    const columns = [
      { key: "id", header: "Student ID" },
      { key: "watermarkId", header: "Watermark ID" },
      { key: "name", header: "Name" },
      { key: "email", header: "Email" },
      { key: "phone", header: "Phone" },
      { key: "enrolledCourses", header: "Enrolled Courses" },
      { key: "role", header: "Role" },
      { key: "createdAt", header: "Account Created" },
      { key: "enrollmentsCount", header: "Enrollments" },
    ] as const;

    const result = await writeRowsToGoogleSheet({
      sheetName: "Students",
      columns,
      rows,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Students exported to Google Sheets successfully.",
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
    console.error("Google Sheets students export failed:", error);

    return NextResponse.json(
      {
        error: "Failed to export students to Google Sheets.",
      },
      { status: 500 },
    );
  }
}