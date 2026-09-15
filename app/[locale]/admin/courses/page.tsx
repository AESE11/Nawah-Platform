import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAdminCourses } from "@/lib/services/admin-service";
import { isLocale } from "@/lib/locale";

export default async function AdminCoursesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";
  const courses = await getAdminCourses();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">
          {safeLocale === "ar" ? "إدارة الدورات" : "Course management"}
        </h1>
        <Link href={`/${safeLocale}/admin/courses/new`}>
          <Button size="sm">{safeLocale === "ar" ? "دورة جديدة" : "New course"}</Button>
        </Link>
      </div>

      {courses.length === 0 ? (
        <Card className="p-8 text-slate-600">
          {safeLocale === "ar" ? "لا توجد دورات حتى الآن." : "No courses have been created yet."}
        </Card>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => {
            const lessonCount = course.chapters.reduce((sum, chapter) => sum + chapter.lessons.length, 0);
            const title = safeLocale === "ar" ? course.titleAr : course.titleEn;

            return (
              <Card key={course.id} className="p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {course.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {safeLocale === "ar" ? course.category.nameAr : course.category.nameEn}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <span>{safeLocale === "ar" ? `السعر: ${course.price}` : `Price: ${course.price}`}</span>
                    <span>{safeLocale === "ar" ? `الفصول: ${course.chapters.length}` : `Chapters: ${course.chapters.length}`}</span>
                    <span>{safeLocale === "ar" ? `الدروس: ${lessonCount}` : `Lessons: ${lessonCount}`}</span>
                    <Link href={`/${safeLocale}/admin/courses/${course.id}`}>
                      <Button size="sm" variant="secondary">{safeLocale === "ar" ? "إدارة" : "Manage"}</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
