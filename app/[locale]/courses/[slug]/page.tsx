import Image from "next/image";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n";
import { isLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";

export default async function CourseSlugPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";
  const dictionary = await getDictionary(safeLocale);

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      category: true,
      chapters: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!course || course.status !== "PUBLISHED") {
    notFound();
  }

  const title = safeLocale === "ar" ? course.titleAr : course.titleEn;
  const description = safeLocale === "ar" ? course.descriptionAr : course.descriptionEn;

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden p-0">
        {course.thumbnailUrl ? (
          <div className="relative h-72 w-full">
            <Image src={course.thumbnailUrl} alt={title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 75vw" />
          </div>
        ) : null}
        <div className="space-y-4 p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              {course.category?.nameAr ?? course.category?.nameEn ?? "General"}
            </span>
            {course.featured ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                {safeLocale === "ar" ? "مميز" : "Featured"}
              </span>
            ) : null}
          </div>

          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          <p className="text-slate-600">{description || ""}</p>
          <div className="flex items-center justify-between gap-3">
            <span className="text-2xl font-bold text-slate-900">{course.price ? `${course.price} SAR` : "Free"}</span>
            <span className="text-sm text-slate-500">{safeLocale === "ar" ? "الحالة" : "Status"}: {course.status}</span>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">{dictionary.common.courses}</h2>

        {course.chapters.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
            {safeLocale === "ar" ? "لا توجد فصول في هذه الدورة." : "This course has no chapters yet."}
          </div>
        ) : null}

        {course.chapters.map((chapter) => (
          <Card key={chapter.id} className="p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-slate-900">
                {safeLocale === "ar" ? chapter.titleAr : chapter.titleEn}
              </h3>
              <span className="text-sm text-slate-500">{safeLocale === "ar" ? `الفصل ${chapter.order + 1}` : `Chapter ${chapter.order + 1}`}</span>
            </div>

            <div className="space-y-3">
              {chapter.lessons.length === 0 ? (
                <div className="text-sm text-slate-600">
                  {safeLocale === "ar" ? "لا توجد دروس في هذا الفصل." : "No lessons in this chapter yet."}
                </div>
              ) : null}

              {chapter.lessons.map((lesson) => (
                <div key={lesson.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-medium text-slate-900">
                      {safeLocale === "ar" ? lesson.titleAr : lesson.titleEn}
                    </h4>
                    {lesson.duration ? (
                      <span className="text-xs text-slate-500">{lesson.duration}s</span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {safeLocale === "ar" ? lesson.descriptionAr || "" : lesson.descriptionEn || ""}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
