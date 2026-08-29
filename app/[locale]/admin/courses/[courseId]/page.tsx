import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";
import { ConfirmActionButton } from "@/components/admin/confirm-action";
import { createChapterAction, createLessonAction, deleteCourseAction, deleteLessonAction, updateCourseAction } from "@/lib/actions/content-actions";
import { prisma } from "@/lib/prisma";
import { isLocale } from "@/lib/locale";

export default async function AdminCourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; courseId: string }>;
}) {
  const { locale, courseId } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      category: true,
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
    return (
      <Card className="p-8 text-slate-600">
        {safeLocale === "ar" ? "الدورة غير موجودة." : "Course not found."}
      </Card>
    );
  }

  const lessonCount = course.chapters.reduce((sum, chapter) => sum + chapter.lessons.length, 0);

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs locale={safeLocale} items={[{ href: "/admin/courses", label: safeLocale === "ar" ? "الدورات" : "Courses" }, { label: safeLocale === "ar" ? course.titleAr : course.titleEn }]} />

      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">{course.status}</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">{safeLocale === "ar" ? course.titleAr : course.titleEn}</h1>
          </div>
          <div className="flex gap-2">
            <Link href={`/${safeLocale}/courses/${course.slug}`}>
              <Button variant="secondary" size="sm">{safeLocale === "ar" ? "معاينة" : "Preview"}</Button>
            </Link>
            <form action={async (formData) => {
              "use server";
              await deleteCourseAction(formData, safeLocale);
            }}>
              <input type="hidden" name="courseId" value={course.id} />
              <ConfirmActionButton type="submit" size="sm" variant="outline" confirmText={safeLocale === "ar" ? "هل تريد حذف هذه الدورة؟" : "Delete this course?"}>
                {safeLocale === "ar" ? "حذف" : "Delete"}
              </ConfirmActionButton>
            </form>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3 text-sm text-slate-600">
          <span>{safeLocale === "ar" ? `الفئة: ${safeLocale === "ar" ? course.category.nameAr : course.category.nameEn}` : `Category: ${course.category.nameEn}`}</span>
          <span>{safeLocale === "ar" ? `السعر: ${course.price}` : `Price: ${course.price}`}</span>
          <span>{safeLocale === "ar" ? `الدروس: ${lessonCount}` : `Lessons: ${lessonCount}`}</span>
        </div>

        <form action={async (formData) => {
          "use server";
          await updateCourseAction(formData, safeLocale);
        }} className="mt-6 grid gap-4 md:grid-cols-2">
          <input type="hidden" name="courseId" value={course.id} />
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>{safeLocale === "ar" ? "العنوان بالعربية" : "Arabic title"}</span>
            <input name="titleAr" defaultValue={course.titleAr} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>{safeLocale === "ar" ? "العنوان بالإنجليزية" : "English title"}</span>
            <input name="titleEn" defaultValue={course.titleEn} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>{safeLocale === "ar" ? "السعر" : "Price"}</span>
            <input name="price" type="number" min="0" step="0.01" defaultValue={Number(course.price)} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>{safeLocale === "ar" ? "الحالة" : "Status"}</span>
            <select name="status" defaultValue={course.status} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            <span>{safeLocale === "ar" ? "الوصف المختصر بالعربية" : "Arabic short description"}</span>
            <textarea name="shortDescriptionAr" defaultValue={course.shortDescriptionAr ?? ""} rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            <span>{safeLocale === "ar" ? "الوصف المختصر بالإنجليزية" : "English short description"}</span>
            <textarea name="shortDescriptionEn" defaultValue={course.shortDescriptionEn ?? ""} rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            <span>{safeLocale === "ar" ? "الوصف بالعربية" : "Arabic description"}</span>
            <textarea name="descriptionAr" defaultValue={course.descriptionAr ?? ""} rows={4} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            <span>{safeLocale === "ar" ? "الوصف بالإنجليزية" : "English description"}</span>
            <textarea name="descriptionEn" defaultValue={course.descriptionEn ?? ""} rows={4} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="featured" defaultChecked={course.featured} />
            <span>{safeLocale === "ar" ? "مميزة" : "Featured"}</span>
          </label>
          <div className="md:col-span-2 flex gap-3">
            <Button type="submit">{safeLocale === "ar" ? "حفظ التغييرات" : "Save changes"}</Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900">{safeLocale === "ar" ? "الفصول" : "Chapters"}</h2>
        <div className="mt-4 space-y-4">
          {course.chapters.map((chapter) => (
            <div key={chapter.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-lg font-semibold text-slate-900">{safeLocale === "ar" ? chapter.titleAr : chapter.titleEn}</p>
              </div>

              <form action={async (formData) => {
                "use server";
                await createLessonAction(formData, safeLocale);
              }} className="mt-4 grid gap-3 md:grid-cols-2">
                <input type="hidden" name="courseId" value={course.id} />
                <input type="hidden" name="chapterId" value={chapter.id} />
                <input name="titleAr" placeholder={safeLocale === "ar" ? "عنوان الدرس بالعربية" : "Arabic lesson title"} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800" />
                <input name="titleEn" placeholder={safeLocale === "ar" ? "عنوان الدرس بالإنجليزية" : "English lesson title"} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800" />
                <input name="muxAssetId" placeholder={safeLocale === "ar" ? "Mux Asset ID" : "Mux Asset ID"} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800" />
                <input name="muxPlaybackId" placeholder={safeLocale === "ar" ? "Mux Playback ID" : "Mux Playback ID"} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800" />
                <input name="duration" type="number" min="0" placeholder={safeLocale === "ar" ? "المدة (ثانية)" : "Duration (seconds)"} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800" />
                <Button type="submit" size="sm">{safeLocale === "ar" ? "إضافة درس" : "Add lesson"}</Button>
              </form>

              <div className="mt-4 space-y-2">
                {chapter.lessons.map((lesson) => (
                  <div key={lesson.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-900">{safeLocale === "ar" ? lesson.titleAr : lesson.titleEn}</span>
                      <form action={async (formData) => {
                        "use server";
                        await deleteLessonAction(formData, safeLocale);
                      }}>
                        <input type="hidden" name="lessonId" value={lesson.id} />
                        <input type="hidden" name="courseId" value={course.id} />
                        <ConfirmActionButton type="submit" size="sm" variant="outline" confirmText={safeLocale === "ar" ? "حذف هذا الدرس؟" : "Delete this lesson?"}>
                          {safeLocale === "ar" ? "حذف" : "Delete"}
                        </ConfirmActionButton>
                      </form>
                    </div>
                    <p className="mt-1 text-slate-600">{lesson.muxPlaybackId ?? safeLocale === "ar" ? "لا يوجد playback ID" : "No playback ID"}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <form action={async (formData) => {
          "use server";
          await createChapterAction(formData, safeLocale);
        }} className="mt-6 grid gap-3 md:grid-cols-2">
          <input type="hidden" name="courseId" value={course.id} />
          <input name="titleAr" placeholder={safeLocale === "ar" ? "عنوان الفصل بالعربية" : "Arabic chapter title"} required className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800" />
          <input name="titleEn" placeholder={safeLocale === "ar" ? "عنوان الفصل بالإنجليزية" : "English chapter title"} required className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800" />
          <Button type="submit" className="md:col-span-2">{safeLocale === "ar" ? "إضافة فصل" : "Add chapter"}</Button>
        </form>
      </Card>
    </div>
  );
}
