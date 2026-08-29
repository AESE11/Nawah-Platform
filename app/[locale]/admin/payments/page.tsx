import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { approvePaymentAction, rejectPaymentAction } from "@/lib/actions/payment-actions";
import { getAdminPayments } from "@/lib/services/admin-service";
import { isLocale } from "@/lib/locale";

export default async function AdminPaymentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";
  const payments = await getAdminPayments();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">
          {safeLocale === "ar" ? "مدفوعات الطلاب" : "Student payments"}
        </h1>
      </div>

      <div className="space-y-4">
        {payments.map((payment) => (
          <Card key={payment.id} className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">{payment.course.titleEn}</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    {payment.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  {payment.user.name ?? payment.user.email} • {payment.user.email}
                </p>
                <p className="text-sm text-slate-600">
                  {payment.paymentMethod.nameEn} • {payment.amount.toString()} SAR
                </p>
                {payment.transactionReference ? (
                  <p className="text-sm text-slate-600">
                    {safeLocale === "ar" ? "الإشارة:" : "Reference:"} {payment.transactionReference}
                  </p>
                ) : null}
                {payment.proofUrl ? (
                  <a href={payment.proofUrl} target="_blank" rel="noreferrer" className="text-sm text-sky-700 underline">
                    {safeLocale === "ar" ? "عرض إثبات الدفع" : "View payment proof"}
                  </a>
                ) : null}
              </div>

              {payment.status === "PENDING" ? (
                <form action={async (formData) => {
                  "use server";
                  await approvePaymentAction(formData, safeLocale);
                }} className="flex flex-col gap-2">
                  <input type="hidden" name="paymentId" value={payment.id} />
                  <textarea
                    name="adminNotes"
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
                    placeholder={safeLocale === "ar" ? "ملاحظات الإدارة" : "Admin notes"}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">
                      {safeLocale === "ar" ? "اعتماد" : "Approve"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      formAction={async () => {
                        "use server";
                        const formData = new FormData();
                        formData.set("paymentId", payment.id);
                        formData.set("adminNotes", "");
                        await rejectPaymentAction(formData, safeLocale);
                      }}
                    >
                      {safeLocale === "ar" ? "رفض" : "Reject"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="text-sm text-slate-600">
                  {payment.reviewedUser ? (
                    <p>
                      {safeLocale === "ar" ? "تمت المراجعة بواسطة" : "Reviewed by"}: {payment.reviewedUser.name ?? payment.reviewedUser.email}
                    </p>
                  ) : null}
                  {payment.adminNotes ? <p>{payment.adminNotes}</p> : null}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
