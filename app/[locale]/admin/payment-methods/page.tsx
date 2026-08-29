import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";
import { ConfirmActionButton } from "@/components/admin/confirm-action";
import { createPaymentMethodAction, deletePaymentMethodAction, updatePaymentMethodAction } from "@/lib/actions/payment-method-actions";
import { isLocale } from "@/lib/locale";

export default async function AdminPaymentMethodsPage({
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

  const [methods, total] = await Promise.all([
    prisma.paymentMethod.findMany({
      where: query
        ? {
            OR: [
              { nameAr: { contains: query, mode: "insensitive" } },
              { nameEn: { contains: query, mode: "insensitive" } },
              { instructionsAr: { contains: query, mode: "insensitive" } },
              { instructionsEn: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.paymentMethod.count({
      where: query
        ? {
            OR: [
              { nameAr: { contains: query, mode: "insensitive" } },
              { nameEn: { contains: query, mode: "insensitive" } },
              { instructionsAr: { contains: query, mode: "insensitive" } },
              { instructionsEn: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs locale={safeLocale} items={[{ label: safeLocale === "ar" ? "طرق الدفع" : "Payment methods" }]} />

      <Card className="p-5">
        <h1 className="text-2xl font-bold text-slate-900">{safeLocale === "ar" ? "إدارة طرق الدفع" : "Payment methods"}</h1>

        <form action={async (formData) => {
          "use server";
          await createPaymentMethodAction(formData, safeLocale);
        }} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>{safeLocale === "ar" ? "الاسم بالعربية" : "Arabic name"}</span>
            <input name="nameAr" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>{safeLocale === "ar" ? "الاسم بالإنجليزية" : "English name"}</span>
            <input name="nameEn" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>{safeLocale === "ar" ? "ملاحظات بالعربية" : "Arabic instructions"}</span>
            <textarea name="instructionsAr" rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>{safeLocale === "ar" ? "ملاحظات بالإنجليزية" : "English instructions"}</span>
            <textarea name="instructionsEn" rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>{safeLocale === "ar" ? "التفاصيل بالعربية" : "Arabic account details"}</span>
            <textarea name="accountDetailsAr" rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>{safeLocale === "ar" ? "التفاصيل بالإنجليزية" : "English account details"}</span>
            <textarea name="accountDetailsEn" rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="enabled" defaultChecked />
            <span>{safeLocale === "ar" ? "مفعل" : "Enabled"}</span>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>{safeLocale === "ar" ? "ترتيب" : "Sort order"}</span>
            <input name="sortOrder" type="number" min="0" defaultValue="0" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400" />
          </label>
          <div className="md:col-span-2">
            <Button type="submit">{safeLocale === "ar" ? "إضافة طريقة" : "Add payment method"}</Button>
          </div>
        </form>
      </Card>

      <Card className="p-5">
        <form method="get" className="mb-4 flex flex-col gap-3 md:flex-row">
          <input
            name="q"
            defaultValue={query}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400"
            placeholder={safeLocale === "ar" ? "بحث في طرق الدفع" : "Search payment methods"}
          />
          <Button type="submit" variant="secondary">{safeLocale === "ar" ? "بحث" : "Search"}</Button>
        </form>

        {methods.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-sm text-slate-600">
            {safeLocale === "ar" ? "لا توجد طرق دفع." : "No payment methods found."}
          </div>
        ) : (
          <div className="space-y-4">
            {methods.map((method) => (
              <div key={method.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{safeLocale === "ar" ? method.nameAr : method.nameEn}</p>
                    <p className="text-sm text-slate-600">{method.enabled ? (safeLocale === "ar" ? "مفعل" : "Enabled") : (safeLocale === "ar" ? "معطل" : "Disabled")}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={async (formData) => {
                      "use server";
                      await updatePaymentMethodAction(formData, safeLocale);
                    }} className="flex flex-wrap gap-2">
                      <input type="hidden" name="paymentMethodId" value={method.id} />
                      <input type="hidden" name="nameAr" value={method.nameAr} />
                      <input type="hidden" name="nameEn" value={method.nameEn} />
                      <input type="hidden" name="instructionsAr" value={method.instructionsAr ?? ""} />
                      <input type="hidden" name="instructionsEn" value={method.instructionsEn ?? ""} />
                      <input type="hidden" name="accountDetailsAr" value={method.accountDetailsAr ?? ""} />
                      <input type="hidden" name="accountDetailsEn" value={method.accountDetailsEn ?? ""} />
                      <input type="hidden" name="enabled" value={String(method.enabled)} />
                      <input type="hidden" name="sortOrder" value={String(method.sortOrder)} />
                      <Button type="submit" variant="secondary" size="sm">{safeLocale === "ar" ? "تحديث" : "Refresh"}</Button>
                    </form>
                    <form action={async (formData) => {
                      "use server";
                      await deletePaymentMethodAction(formData, safeLocale);
                    }}>
                      <input type="hidden" name="paymentMethodId" value={method.id} />
                      <ConfirmActionButton type="submit" size="sm" variant="outline" confirmText={safeLocale === "ar" ? "هل تريد حذف طريقة الدفع هذه؟" : "Delete this payment method?"}>
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
            <Link href={`/${safeLocale}/admin/payment-methods?page=${Math.max(1, page - 1)}${query ? `&q=${encodeURIComponent(query)}` : ""}`} className={page <= 1 ? "pointer-events-none opacity-50" : ""}>
              {safeLocale === "ar" ? "السابق" : "Previous"}
            </Link>
            <span>{page} / {totalPages}</span>
            <Link href={`/${safeLocale}/admin/payment-methods?page=${Math.min(totalPages, page + 1)}${query ? `&q=${encodeURIComponent(query)}` : ""}`} className={page >= totalPages ? "pointer-events-none opacity-50" : ""}>
              {safeLocale === "ar" ? "التالي" : "Next"}
            </Link>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
