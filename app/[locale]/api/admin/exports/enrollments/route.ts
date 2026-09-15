import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { isAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { generateCsv, generateExcel } from "@/lib/exports";

const allowedStatuses = ["ALL", "ACTIVE", "SUSPENDED"] as const;
type EnrollmentStatusFilter = (typeof allowedStatuses)[number];

export async function GET(request: Request) {
  const session = await getAuthSession();

  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format")?.toLowerCase() ?? "xlsx";
  const requestedStatus = url.searchParams.get("status")?.toUpperCase();

  if (format !== "xlsx" && format !== "csv") {
    return NextResponse.json(
      { error: "Unsupported export format" },
      { status: 400 },
    );
  }

  const status: EnrollmentStatusFilter =
    allowedStatuses.includes(requestedStatus as EnrollmentStatusFilter)
      ? (requestedStatus as EnrollmentStatusFilter)
      : "ALL";

  const enrollments = await prisma.enrollment.findMany({
    where: status === "ALL" ? undefined : { status },
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

  const date = new Date().toISOString().slice(0, 10);
  const statusSuffix = status === "ALL" ? "all" : status.toLowerCase();

  if (format === "csv") {
    const csv = generateCsv(rows, columns);

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="enrollments-${statusSuffix}-${date}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const excel = await generateExcel(
    rows,
    columns,
    `Enrollments-${statusSuffix}`,
  );

  return new Response(new Uint8Array(excel), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="enrollments-${statusSuffix}-${date}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}