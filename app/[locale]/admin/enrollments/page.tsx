import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createManualEnrollmentAction } from "@/lib/actions/payment-actions";
import { getAdminEnrollments, getAdminCourses, getAdminUsers } from "@/lib/services/admin-service";
import { isLocale } from "@/lib/locale";

export default async function AdminEnrollmentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";
  const [enrollments, courses, users] = await Promise.all([getAdminEnrollments(), getAdminCourses(), getAdminUsers()]);

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h2 className="text-xl font-bold text-slate-900">
          {safeLocale === "ar" ? "إضافة اشتراك يدوي" : "Create manual enrollment"}
        </h2>

        <form action={async (formData) => {
          "use server";
          await createManualEnrollmentAction(formData, safeLocale);
        }} className="mt-4 grid gap-4 md:grid-cols-3">
          <select name="courseId" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" defaultValue="">
            <option value="" disabled>
              {safeLocale === "ar" ? "اختر الدورة" : "Select course"}
            </option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {safeLocale === "ar" ? course.titleAr : course.titleEn}
              </option>
            ))}
          </select>

          <select name="userId" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" defaultValue="">
            <option value="" disabled>
              {safeLocale === "ar" ? "اختر الطالب" : "Select student"}
            </option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name ?? user.email}
              </option>
            ))}
          </select>

          <Button type="submit">
            {safeLocale === "ar" ? "إنشاء اشتراك" : "Create enrollment"}
          </Button>
        </form>
      </Card>

      <div className="space-y-4">
        {enrollments.map((enrollment) => (
          <Card key={enrollment.id} className="p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-900">
                  {safeLocale === "ar" ? enrollment.course.titleAr : enrollment.course.titleEn}
                </p>
                <p className="text-sm text-slate-600">
                  {enrollment.user.name ?? enrollment.user.email} • {enrollment.user.email}
                </p>
              </div>

              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                {enrollment.status}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
