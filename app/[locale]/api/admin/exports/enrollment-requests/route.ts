import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { isAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { generateCsv, generateExcel } from "@/lib/exports";

const allowedStatuses = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const;
type RequestStatusFilter = (typeof allowedStatuses)[number];

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

  const status: RequestStatusFilter =
    allowedStatuses.includes(requestedStatus as RequestStatusFilter)
      ? (requestedStatus as RequestStatusFilter)
      : "ALL";

  const requests = await prisma.enrollmentRequest.findMany({
    where: status === "ALL" ? undefined : { status },
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
    transferWalletNumber: request.transferWalletNumber,
    personalPhoneNumber: request.personalPhoneNumber,
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
    { key: "transferWalletNumber", header: "Transfer Wallet" },
    { key: "personalPhoneNumber", header: "Phone" },
    { key: "courseName", header: "Course Name" },
    { key: "courseArabic", header: "Course (Arabic)" },
    { key: "courseEnglish", header: "Course (English)" },
    { key: "coursePrice", header: "Course Price" },
    { key: "currency", header: "Currency" },
    { key: "status", header: "Status" },
    { key: "adminNotes", header: "Admin Notes" },
    { key: "submittedAt", header: "Submitted At" },
    { key: "reviewedAt", header: "Reviewed At" },
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
        "Content-Disposition": `attachment; filename="enrollment-requests-${statusSuffix}-${date}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const excel = await generateExcel(
    rows,
    columns,
    `Enrollment Requests-${statusSuffix}`,
  );

  return new Response(new Uint8Array(excel), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="enrollment-requests-${statusSuffix}-${date}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}