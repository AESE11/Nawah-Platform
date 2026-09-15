import { Card } from "@/components/ui/card";
import { getAdminOverview } from "@/lib/services/admin-service";
import { isLocale } from "@/lib/locale";

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";
  const overview = await getAdminOverview();

  const stats = [
    {
      label: safeLocale === "ar" ? "إجمالي الدورات" : "Courses",
      value: overview.courseCount,
      tone: "bg-slate-900 text-white",
    },
    {
      label: safeLocale === "ar" ? "المدفوعات المعلقة" : "Pending payments",
      value: overview.pendingPayments,
      tone: "bg-amber-100 text-amber-800",
    },
    {
      label: safeLocale === "ar" ? "الاشتراكات النشطة" : "Active enrollments",
      value: overview.activeEnrollments,
      tone: "bg-emerald-100 text-emerald-800",
    },
    {
      label: safeLocale === "ar" ? "الطلاب" : "Students",
      value: overview.studentCount,
      tone: "bg-sky-100 text-sky-800",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label} className="p-5">
            <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${item.tone}`}>
              {item.label}
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900">{item.value}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900">
            {safeLocale === "ar" ? "إجمالي الإيرادات المعتمدة" : "Approved revenue"}
          </h2>
          <p className="mt-4 text-4xl font-bold text-slate-900">
            {new Intl.NumberFormat(safeLocale === "ar" ? "ar-EG" : "en-EG", {
              style: "currency",
              currency: "EGP",
              maximumFractionDigits: 2,
            }).format(overview.revenue)}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {safeLocale === "ar"
              ? "مجموع المدفوعات التي تم اعتمادها من خلال النظام."
              : "Total revenue from payments already approved within the platform."}
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900">
            {safeLocale === "ar" ? "مؤشرات التشغيل" : "Operations"}
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li>• {safeLocale === "ar" ? "مراجعة المدفوعات المعلقة" : "Review pending payments"}</li>
            <li>• {safeLocale === "ar" ? "إدارة محتوى الدورات" : "Manage course content"}</li>
            <li>• {safeLocale === "ar" ? "إدارة اشتراكات الطلاب" : "Manage student enrollments"}</li>
            <li>• {safeLocale === "ar" ? "مراجعة مستخدمي المنصة" : "Review platform users"}</li>
          </ul>
        </Card>
      </section>
    </div>
  );
}
