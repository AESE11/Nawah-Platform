import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAuthSession } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { isLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";

export default async function DashboardCoursesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";
  const session = await getAuthSession();

  if (!session?.user) {
    redirect(`/${safeLocale}/login`);
  }

  if (session.user.role !== "STUDENT") {
    redirect(`/${safeLocale}/login`);
  }

  const dictionary = await getDictionary(safeLocale);
  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
    },
    include: {
      course: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{dictionary.common.courses}</h1>
      </div>

      {enrollments.length === 0 ? (
        <Card className="p-8">
          <p className="text-slate-600">
            {safeLocale === "ar" ? "ليس لديك دورات نشطة حالياً." : "You do not have any active courses yet."}
          </p>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {enrollments.map((enrollment) => (
          <Card key={enrollment.id} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {safeLocale === "ar" ? enrollment.course.titleAr : enrollment.course.titleEn}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {safeLocale === "ar" ? enrollment.course.shortDescriptionAr || "" : enrollment.course.shortDescriptionEn || ""}
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                {safeLocale === "ar" ? "نشط" : "Active"}
              </span>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="text-sm text-slate-500">
                {safeLocale === "ar" ? "الحالة: نشط" : "Status: Active"}
              </span>
              <Link href={`/${safeLocale}/dashboard/courses/${enrollment.courseId}`}>
                <Button size="sm">
                  {safeLocale === "ar" ? "مشاهدة الكورس" : "Access Course"}
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
