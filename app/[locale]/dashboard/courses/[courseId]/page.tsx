
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAuthSession } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { isLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { getActiveEnrollmentForCourse } from "@/lib/services/enrollment-service";

export default async function DashboardCoursePlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; courseId: string }>;
  searchParams?: Promise<{ lessonId?: string }>;
}) {
  const { locale, courseId } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";
  const session = await getAuthSession();

  if (!session?.user) {
    redirect(`/${safeLocale}/login`);
  }

  if (session.user.role !== "STUDENT") {
    redirect(`/${safeLocale}/login`);
  }

  const enrollment = await getActiveEnrollmentForCourse(
    session.user.id,
    courseId,
  );

  if (!enrollment) {
    redirect(`/${safeLocale}/dashboard/courses`);
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      chapters: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!course) {
    redirect(`/${safeLocale}/dashboard/courses`);
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const selectedLessonId =
    resolvedSearchParams.lessonId ??
    course.chapters[0]?.lessons[0]?.id ??
    null;

  const selectedLesson =
    course.chapters
      .flatMap((chapter) => chapter.lessons)
      .find((lesson) => lesson.id === selectedLessonId) ??
    course.chapters[0]?.lessons[0] ??
    null;

  const dictionary = await getDictionary(safeLocale);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">
          {safeLocale === "ar" ? course.titleAr : course.titleEn}
        </h1>

        <p className="mt-2 text-slate-600">
          {safeLocale === "ar"
            ? course.descriptionAr || ""
            : course.descriptionEn || ""}
        </p>
      </div>

      {selectedLesson ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              {safeLocale === "ar" ? "الدرس المحدد" : "Selected lesson"}
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              {safeLocale === "ar"
                ? selectedLesson.titleAr
                : selectedLesson.titleEn}
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              {safeLocale === "ar"
                ? selectedLesson.descriptionAr || ""
                : selectedLesson.descriptionEn || ""}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-sm text-blue-900">
            {safeLocale === "ar"
              ? "مشاهدة الدروس متاحة من خلال تطبيق Android فقط. افتح التطبيق وسجّل الدخول بحسابك لمتابعة الكورس."
              : "Lesson playback is available through the Android app only. Open the app and sign in to continue learning."}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            {safeLocale === "ar" ? "الفصول والدروس" : "Chapters and lessons"}
          </h2>

          <div className="mt-4 space-y-4">
            {course.chapters.map((chapter) => (
              <div
                key={chapter.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {safeLocale === "ar" ? chapter.titleAr : chapter.titleEn}
                </p>

                <div className="mt-3 space-y-2">
                  {chapter.lessons.map((lesson) => {
                    const isSelected = lesson.id === selectedLesson?.id;
                    const href = `/${safeLocale}/dashboard/courses/${courseId}?lessonId=${lesson.id}`;

                    return (
                      <Link
                        href={href}
                        key={lesson.id}
                        className="block"
                      >
                        <div
                          className={`rounded-xl border p-3 transition-colors ${
                            isSelected
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">
                              {safeLocale === "ar"
                                ? lesson.titleAr
                                : lesson.titleEn}
                            </span>

                            {lesson.duration ? (
                              <span className="text-xs opacity-75">
                                {lesson.duration}s
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="space-y-4">
          <Card className="p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
              {dictionary.common.courses}
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-900">
              {safeLocale === "ar"
                ? "معلومات الدورة"
                : "Course information"}
            </h2>

            <div className="mt-4 text-sm text-slate-600">
              <p>
                {safeLocale === "ar"
                  ? `الفصول: ${course.chapters.length}`
                  : `Chapters: ${course.chapters.length}`}
              </p>

              <p>
                {safeLocale === "ar"
                  ? `الدروس: ${course.chapters.reduce(
                      (sum, chapter) => sum + chapter.lessons.length,
                      0,
                    )}`
                  : `Lessons: ${course.chapters.reduce(
                      (sum, chapter) => sum + chapter.lessons.length,
                      0,
                    )}`}
              </p>
            </div>
          </Card>

          <div className="flex justify-start">
            <Link href={`/${safeLocale}/dashboard/courses`}>
              <Button variant="secondary">
                {safeLocale === "ar"
                  ? "عودة إلى الدورات"
                  : "Back to courses"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
