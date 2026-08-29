import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";
import { createCourseAction } from "@/lib/actions/content-actions";
import { prisma } from "@/lib/prisma";
import { isLocale } from "@/lib/locale";

export default async function AdminCreateCoursePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";
  const categories = await prisma.category.findMany({ orderBy: { nameAr: "asc" } });

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs locale={safeLocale} items={[{ href: "/admin/courses", label: safeLocale === "ar" ? "الدورات" : "Courses" }, { label: safeLocale === "ar" ? "دورة جديدة" : "New course" }]} />

      <Card className="p-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {safeLocale === "ar" ? "إنشاء دورة" : "Create course"}
        </h1>

        <form action={async (formData) => {
          "use server";
          await createCourseAction(formData, safeLocale);
        }} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>{safeLocale === "ar" ? "العنوان بالعربية" : "Arabic title"}</span>
            <input name="titleAr" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>{safeLocale === "ar" ? "العنوان بالإنجليزية" : "English title"}</span>
            <input name="titleEn" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>{safeLocale === "ar" ? "الرابط" : "Slug"}</span>
            <input name="slug" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>{safeLocale === "ar" ? "السعر" : "Price"}</span>
            <input name="price" type="number" min="0" step="0.01" defaultValue="0" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            <span>{safeLocale === "ar" ? "الوصف المختصر بالعربية" : "Arabic short description"}</span>
            <textarea name="shortDescriptionAr" rows={2} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            <span>{safeLocale === "ar" ? "الوصف المختصر بالإنجليزية" : "English short description"}</span>
            <textarea name="shortDescriptionEn" rows={2} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            <span>{safeLocale === "ar" ? "الوصف بالعربية" : "Arabic description"}</span>
            <textarea name="descriptionAr" rows={4} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            <span>{safeLocale === "ar" ? "الوصف بالإنجليزية" : "English description"}</span>
            <textarea name="descriptionEn" rows={4} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>{safeLocale === "ar" ? "الفئة" : "Category"}</span>
            <select name="categoryId" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400">
              <option value="">{safeLocale === "ar" ? "اختر الفئة" : "Select category"}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{safeLocale === "ar" ? category.nameAr : category.nameEn}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>{safeLocale === "ar" ? "الحالة" : "Status"}</span>
            <select name="status" defaultValue="DRAFT" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="featured" />
            <span>{safeLocale === "ar" ? "مميزة" : "Featured"}</span>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            <span>{safeLocale === "ar" ? "رابط الصورة" : "Thumbnail URL"}</span>
            <input name="thumbnailUrl" type="url" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <div className="md:col-span-2 flex gap-3">
            <Button type="submit">{safeLocale === "ar" ? "حفظ الدورة" : "Save course"}</Button>
            <Link href={`/${safeLocale}/admin/courses`}>
              <Button type="button" variant="secondary">{safeLocale === "ar" ? "إلغاء" : "Cancel"}</Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
