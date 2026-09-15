import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";
import { approvePaymentAction, rejectPaymentAction } from "@/lib/actions/payment-actions";
import { prisma } from "@/lib/prisma";
import { isLocale } from "@/lib/locale";
import { formatEgpCurrency } from "@/lib/currency";

export default async function AdminPaymentDetailPage({ params }: { params: Promise<{ locale: string; paymentId: string }> }) {
  const { locale, paymentId } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      user: true,
      course: true,
      paymentMethod: true,
      reviewedUser: true,
    },
  });

  if (!payment) {
    return <Card className="p-8 text-slate-600">{safeLocale === "ar" ? "المعاملة غير موجودة." : "Payment not found."}</Card>;
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs locale={safeLocale} items={[{ href: "/admin/payments", label: safeLocale === "ar" ? "المدفوعات" : "Payments" }, { label: payment.id }]} />

      <Card className="p-6">
        <h1 className="text-2xl font-bold text-slate-900">{safeLocale === "ar" ? "تفاصيل الدفع" : "Payment details"}</h1>
        <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-slate-700">
          <p><strong>{safeLocale === "ar" ? "الطالب" : "Student"}:</strong> {payment.user.name ?? payment.user.email}</p>
          <p><strong>{safeLocale === "ar" ? "الدورة" : "Course"}:</strong> {safeLocale === "ar" ? payment.course.titleAr : payment.course.titleEn}</p>
          <p><strong>{safeLocale === "ar" ? "المبلغ" : "Amount"}:</strong> {formatEgpCurrency(payment.amount.toString(), safeLocale)}</p>
          <p><strong>{safeLocale === "ar" ? "الحالة" : "Status"}:</strong> {payment.status}</p>
          <p><strong>{safeLocale === "ar" ? "طريقة الدفع" : "Method"}:</strong> {payment.paymentMethod.nameEn}</p>
          <p><strong>{safeLocale === "ar" ? "الإشارة" : "Reference"}:</strong> {payment.transactionReference ?? "—"}</p>
        </div>

        {payment.proofUrl ? (
          <a href={payment.proofUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm text-sky-700 underline">
            {safeLocale === "ar" ? "عرض إثبات الدفع" : "View payment proof"}
          </a>
        ) : null}

        {payment.status === "PENDING" ? (
          <form action={async (formData) => {
            "use server";
            await approvePaymentAction(formData, safeLocale);
          }} className="mt-6 space-y-3">
            <input type="hidden" name="paymentId" value={payment.id} />
            <textarea name="adminNotes" rows={3} placeholder={safeLocale === "ar" ? "ملاحظات الإدارة" : "Admin notes"} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800" />
            <div className="flex gap-2">
              <Button type="submit">{safeLocale === "ar" ? "اعتماد" : "Approve"}</Button>
              <Button type="button" variant="outline" formAction={async () => {
                "use server";
                const formData = new FormData();
                formData.set("paymentId", payment.id);
                formData.set("adminNotes", "");
                await rejectPaymentAction(formData, safeLocale);
              }}>
                {safeLocale === "ar" ? "رفض" : "Reject"}
              </Button>
            </div>
          </form>
        ) : null}
      </Card>
    </div>
  );
}
