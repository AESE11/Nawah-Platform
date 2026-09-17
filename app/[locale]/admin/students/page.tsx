import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";
import { ExportButtons } from "@/components/admin/export-buttons";
import { isLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";

export default async function AdminStudentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";
  const arabic = safeLocale === "ar";

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs
        locale={safeLocale}
        items={[{ label: arabic ? "الطلاب" : "Students" }]}
      />

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {arabic ? "الطلاب" : "Students"}
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          {arabic
            ? "عرض الطلاب واشتراكاتهم وإدارتها."
            : "View and manage students and their enrollments."}
        </p>

        <div className="mt-4">
          <ExportButtons
  endpoint={`/${safeLocale}/api/admin/exports/students`}
  googleSheetsEndpoint={`/${safeLocale}/api/admin/exports/students/google-sheets`}
  labels={{
    excel: arabic ? "تصدير Excel" : "Export Excel",
    csv: arabic ? "تصدير CSV" : "Export CSV",
    googleSheets: arabic
      ? "تصدير إلى Google Sheets"
      : "Export to Google Sheets",
  }}
/>
        </div>
      </div>

      {students.length === 0 ? (
        <Card className="p-8 text-slate-600">
          {arabic ? "لا يوجد طلاب." : "No students found."}
        </Card>
      ) : (
        <div className="space-y-4">
          {students.map((student) => (
            <Card key={student.id} className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {student.name ?? student.email}
                  </h2>

                  <p className="text-sm text-slate-600">{student.email}</p>

                  <p className="mt-2 text-xs text-slate-500">
                    {arabic ? "إنشاء الحساب: " : "Account created: "}
                    {student.createdAt.toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span>
                    {arabic
                      ? `الاشتراكات: ${student._count.enrollments}`
                      : `Enrollments: ${student._count.enrollments}`}
                  </span>

                  <Link
                    href={`/${safeLocale}/admin/students/${student.id}`}
                    className="font-medium text-teal-700 hover:text-teal-900"
                  >
                    {arabic ? "عرض التفاصيل" : "View details"}
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}