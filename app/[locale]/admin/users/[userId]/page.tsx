import { Card } from "@/components/ui/card";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";
import { prisma } from "@/lib/prisma";
import { isLocale } from "@/lib/locale";
import { formatEgpCurrency } from "@/lib/currency";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ locale: string; userId: string }> }) {
  const { locale, userId } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      enrollments: {
        include: { course: true },
        orderBy: { createdAt: "desc" },
      },
      payments: {
        include: { course: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    return <Card className="p-8 text-slate-600">{safeLocale === "ar" ? "المستخدم غير موجود." : "User not found."}</Card>;
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs locale={safeLocale} items={[{ href: "/admin/users", label: safeLocale === "ar" ? "المستخدمون" : "Users" }, { label: user.name ?? user.email }]} />

      <Card className="p-6">
        <h1 className="text-3xl font-bold text-slate-900">{user.name ?? user.email}</h1>
        <p className="mt-2 text-slate-600">{user.email}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-700">
          <span className="rounded-full bg-slate-100 px-2.5 py-1">{user.role}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1">{safeLocale === "ar" ? `الدورات: ${user.enrollments.length}` : `Enrollments: ${user.enrollments.length}`}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1">{safeLocale === "ar" ? `المدفوعات: ${user.payments.length}` : `Payments: ${user.payments.length}`}</span>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900">{safeLocale === "ar" ? "الاشتراكات" : "Enrollments"}</h2>
          <div className="mt-4 space-y-3">
            {user.enrollments.map((enrollment) => (
              <div key={enrollment.id} className="rounded-xl border border-slate-200 p-3">
                <p className="font-medium text-slate-900">{safeLocale === "ar" ? enrollment.course.titleAr : enrollment.course.titleEn}</p>
                <p className="text-sm text-slate-600">{enrollment.status}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900">{safeLocale === "ar" ? "المدفوعات" : "Payments"}</h2>
          <div className="mt-4 space-y-3">
            {user.payments.map((payment) => (
              <div key={payment.id} className="rounded-xl border border-slate-200 p-3">
                <p className="font-medium text-slate-900">{safeLocale === "ar" ? payment.course.titleAr : payment.course.titleEn}</p>
                <p className="text-sm text-slate-600">{payment.status} • {formatEgpCurrency(payment.amount.toString(), safeLocale)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
