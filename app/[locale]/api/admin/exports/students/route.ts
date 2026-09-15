import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { isAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { generateCsv, generateExcel } from "@/lib/exports";

export async function GET(request: Request) {
  const session = await getAuthSession();

  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format")?.toLowerCase() ?? "xlsx";

  if (format !== "xlsx" && format !== "csv") {
    return NextResponse.json(
      { error: "Unsupported export format" },
      { status: 400 },
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
    name: student.name ?? "",
    email: student.email,
    role: student.role,
    createdAt: student.createdAt,
    enrollmentsCount: student._count.enrollments,
  }));

  const columns = [
    { key: "id", header: "ID" },
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "role", header: "Role" },
    { key: "createdAt", header: "Account Created" },
    { key: "enrollmentsCount", header: "Enrollments" },
  ] as const;

  const date = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const csv = generateCsv(rows, columns);

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="students-${date}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const excel = await generateExcel(rows, columns, "Students");

  return new Response(new Uint8Array(excel), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="students-${date}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}