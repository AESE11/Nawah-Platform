import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";
import { ConfirmActionButton } from "@/components/admin/confirm-action";
import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from "@/lib/actions/content-actions";
import { isLocale } from "@/lib/locale";

export default async function AdminCategoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ q?: string; page?: string }>;
}) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";
  const query = ((await searchParams)?.q ?? "").trim();
  const page = Number((await searchParams)?.page ?? "1") || 1;
  const pageSize = 10;

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where: query
        ? {
            OR: [
              { nameAr: { contains: query, mode: "insensitive" } },
              { nameEn: { contains: query, mode: "insensitive" } },
              { slug: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { nameAr: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.category.count({
      where: query
        ? {
            OR: [
              { nameAr: { contains: query, mode: "insensitive" } },
              { nameEn: { contains: query, mode: "insensitive" } },
              { slug: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs locale={safeLocale} items={[{ label: safeLocale === "ar" ? "الفئات" : "Categories" }]} />

      <Card className="p-5">
        <h1 className="text-2xl font-bold text-slate-900">
          {safeLocale === "ar" ? "إدارة الفئات" : "Categories management"}
        </h1>

        <form action={async (formData) => {
          "use server";
          await createCategoryAction(formData, safeLocale);
        }} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>{safeLocale === "ar" ? "الاسم بالعربية" : "Arabic name"}</span>
            <input name="nameAr" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>{safeLocale === "ar" ? "الاسم بالإنجليزية" : "English name"}</span>
            <input name="nameEn" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            <span>{safeLocale === "ar" ? "الوصف بالعربية" : "Arabic description"}</span>
            <textarea name="descriptionAr" rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            <span>{safeLocale === "ar" ? "الوصف بالإنجليزية" : "English description"}</span>
            <textarea name="descriptionEn" rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <div className="md:col-span-2">
            <Button type="submit">
              {safeLocale === "ar" ? "إنشاء فئة" : "Create category"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-5">
        <form method="get" className="mb-4 flex flex-col gap-3 md:flex-row">
          <input
            name="q"
            defaultValue={query}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400"
            placeholder={safeLocale === "ar" ? "بحث في الفئات" : "Search categories"}
          />
          <Button type="submit" variant="secondary">
            {safeLocale === "ar" ? "بحث" : "Search"}
          </Button>
        </form>

        {categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-sm text-slate-600">
            {safeLocale === "ar" ? "لا توجد فئات مطابقة." : "No matching categories found."}
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {safeLocale === "ar" ? category.nameAr : category.nameEn}
                    </p>
                    <p className="text-sm text-slate-600">{category.slug}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={async (formData) => {
                      "use server";
                      await updateCategoryAction(formData, safeLocale);
                    }} className="flex flex-wrap gap-2">
                      <input type="hidden" name="categoryId" value={category.id} />
                      <input type="hidden" name="nameAr" value={category.nameAr} />
                      <input type="hidden" name="nameEn" value={category.nameEn} />
                      <input type="hidden" name="descriptionAr" value={category.descriptionAr ?? ""} />
                      <input type="hidden" name="descriptionEn" value={category.descriptionEn ?? ""} />
                      <Button type="submit" variant="secondary" size="sm">
                        {safeLocale === "ar" ? "تحديث" : "Refresh"}
                      </Button>
                    </form>
                    <form action={async (formData) => {
                      "use server";
                      await deleteCategoryAction(formData, safeLocale);
                    }}>
                      <input type="hidden" name="categoryId" value={category.id} />
                      <ConfirmActionButton type="submit" size="sm" variant="outline" confirmText={safeLocale === "ar" ? "هل تريد حذف هذه الفئة؟" : "Delete this category?"}>
                        {safeLocale === "ar" ? "حذف" : "Delete"}
                      </ConfirmActionButton>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="mt-5 flex items-center justify-between text-sm text-slate-600">
            <Link href={`/${safeLocale}/admin/categories?page=${Math.max(1, page - 1)}${query ? `&q=${encodeURIComponent(query)}` : ""}`} className={page <= 1 ? "pointer-events-none opacity-50" : ""}>
              {safeLocale === "ar" ? "السابق" : "Previous"}
            </Link>
            <span>
              {page} / {totalPages}
            </span>
            <Link href={`/${safeLocale}/admin/categories?page=${Math.min(totalPages, page + 1)}${query ? `&q=${encodeURIComponent(query)}` : ""}`} className={page >= totalPages ? "pointer-events-none opacity-50" : ""}>
              {safeLocale === "ar" ? "التالي" : "Next"}
            </Link>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
