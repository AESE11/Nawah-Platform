import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/lib/i18n";
import { isLocale } from "@/lib/locale";
import { formatCoursePrice } from "@/lib/currency";

export const dynamic = "force-dynamic";

export default async function CoursesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";
  const dictionary = await getDictionary(safeLocale);

  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    include: { category: true },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">{dictionary.common.courses}</h1>
        <p className="mt-2 text-slate-600" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => {
          const title = safeLocale === "ar" ? course.titleAr : course.titleEn;
          const description = safeLocale === "ar" ? course.shortDescriptionAr : course.shortDescriptionEn;

          return (
            <Link
              key={course.id}
              href={`/${safeLocale}/courses/${course.slug}`}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              {course.thumbnailUrl ? (
                <div className="relative h-48 w-full">
                  <Image src={course.thumbnailUrl} alt={title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
              ) : null}

              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {course.category?.nameAr ?? course.category?.nameEn ?? "General"}
                  </span>
                  {course.featured ? (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                      {safeLocale === "ar" ? "مميز" : "Featured"}
                    </span>
                  ) : null}
                </div>

                <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                <p className="text-sm text-slate-600">{description || ""}</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-lg font-bold text-slate-900">{Number(course.price) > 0
  ? formatCoursePrice(course.price.toString(), safeLocale)
  : safeLocale === "ar"
    ? "مجانية"
    : "Free"}</span>
                  <span className="text-sm text-slate-500">{safeLocale === "ar" ? "عرض" : "View"}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {courses.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
          {safeLocale === "ar" ? "لا توجد دورات منشورة حاليًا." : "No published courses are available yet."}
        </div>
      ) : null}
    </section>
  );
}
