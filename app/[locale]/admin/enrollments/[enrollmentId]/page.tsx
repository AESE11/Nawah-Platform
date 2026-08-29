import { Card } from "@/components/ui/card";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";
import { prisma } from "@/lib/prisma";
import { isLocale } from "@/lib/locale";

export default async function AdminEnrollmentDetailPage({ params }: { params: Promise<{ locale: string; enrollmentId: string }> }) {
  const { locale, enrollmentId } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { user: true, course: true },
  });

  if (!enrollment) {
    return <Card className="p-8 text-slate-600">{safeLocale === "ar" ? "الاشتراك غير موجود." : "Enrollment not found."}</Card>;
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs locale={safeLocale} items={[{ href: "/admin/enrollments", label: safeLocale === "ar" ? "الاشتراكات" : "Enrollments" }, { label: enrollment.id }]} />

      <Card className="p-6">
        <h1 className="text-2xl font-bold text-slate-900">{safeLocale === "ar" ? "تفاصيل الاشتراك" : "Enrollment details"}</h1>
        <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-slate-700">
          <p><strong>{safeLocale === "ar" ? "المستخدم" : "User"}:</strong> {enrollment.user.name ?? enrollment.user.email}</p>
          <p><strong>{safeLocale === "ar" ? "الدورة" : "Course"}:</strong> {safeLocale === "ar" ? enrollment.course.titleAr : enrollment.course.titleEn}</p>
          <p><strong>{safeLocale === "ar" ? "الحالة" : "Status"}:</strong> {enrollment.status}</p>
          <p><strong>{safeLocale === "ar" ? "تاريخ الانضمام" : "Enrolled at"}:</strong> {enrollment.enrolledAt?.toISOString() ?? "—"}</p>
        </div>
      </Card>
    </div>
  );
}
