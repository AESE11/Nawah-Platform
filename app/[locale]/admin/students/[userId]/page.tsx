import Link from "next/link";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";
import { EnrollmentStatusActions } from "@/components/admin/enrollment-status-actions";
import { Card } from "@/components/ui/card";
import { isLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { getStudentWatermarkId } from "@/lib/watermark";

function getEnrollmentStatus(status: string, arabic: boolean) {
  if (status === "ACTIVE") return arabic ? "نشط" : "Active";
  if (status === "SUSPENDED") return arabic ? "معطل" : "Disabled";
  if (status === "PENDING") return arabic ? "قيد المراجعة" : "Pending";
  if (status === "CANCELLED") return arabic ? "ملغى" : "Cancelled";
  return arabic ? "مكتمل" : "Completed";
}

function getStatusClass(status: string) {
  if (status === "ACTIVE") return "bg-emerald-50 text-emerald-700";
  if (status === "SUSPENDED") return "bg-red-50 text-red-700";
  return "bg-slate-100 text-slate-700";
}

export default async function AdminStudentDetailPage({ params }: { params: Promise<{ locale: string; userId: string }> }) {
  const { locale, userId } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";
  const arabic = safeLocale === "ar";
  const student = await prisma.user.findFirst({
    where: { id: userId, role: "STUDENT" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      enrollmentRequests: {
        select: {
          personalPhoneNumber: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      enrollments: {
        include: { course: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!student) {
  return <Card className="p-8 text-slate-600">{arabic ? "الطالب غير موجود." : "Student not found."}</Card>;
  }

  const watermarkId = getStudentWatermarkId(student.id);
  const phoneNumber = student.enrollmentRequests[0]?.personalPhoneNumber ?? "-";

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs locale={safeLocale} items={[{ href: "/admin/students", label: arabic ? "الطلاب" : "Students" }, { label: student.name ?? student.email }]} />
      <Card className="p-6">
  <h1 className="text-3xl font-bold text-slate-900">{student.name ?? student.email}</h1>
  <p className="mt-2 text-slate-600">{student.email}</p>
  <p className="mt-3 text-sm text-slate-500">{arabic ? "إنشاء الحساب: " : "Account created: "}{student.createdAt.toLocaleDateString()}</p>

  <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
    <p>
      <span className="font-semibold text-slate-900">
        {arabic ? "معرف الطالب: " : "Student ID: "}
      </span>
      {student.id}
    </p>

    <p>
      <span className="font-semibold text-slate-900">
        {arabic ? "معرف العلامة المائية: " : "Watermark ID: "}
      </span>
      ID-{watermarkId}
    </p>

    <p>
      <span className="font-semibold text-slate-900">
        {arabic ? "رقم الهاتف: " : "Phone: "}
      </span>
      {phoneNumber}
    </p>
  </div>
</Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900">{arabic ? "الدورات المشترَك فيها" : "Enrolled courses"}</h2>
        {student.enrollments.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">{arabic ? "لا توجد اشتراكات." : "No enrollments found."}</p>
        ) : (
          <div className="mt-4 space-y-4">
            {student.enrollments.map((enrollment) => (
              <div key={enrollment.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{arabic ? enrollment.course.titleAr : enrollment.course.titleEn}</h3>
                    <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                      <span>{arabic ? "الحالة: " : "Status: "}{getEnrollmentStatus(enrollment.status, arabic)}</span>
                      <span>{arabic ? "تاريخ الاشتراك: " : "Enrolled: "}{enrollment.enrolledAt?.toLocaleDateString() ?? "-"}</span>
                      <span>{arabic ? "آخر تحديث: " : "Updated: "}{enrollment.updatedAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(enrollment.status)}`}>
                    {getEnrollmentStatus(enrollment.status, arabic)}
                  </span>
                </div>
                <div className="mt-4">
                  <EnrollmentStatusActions enrollmentId={enrollment.id} status={enrollment.status} locale={safeLocale} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Link href={`/${safeLocale}/admin/students`} className="text-sm font-medium text-teal-700 hover:text-teal-900">
        {arabic ? "العودة إلى الطلاب" : "Back to students"}
      </Link>
    </div>
  );
}