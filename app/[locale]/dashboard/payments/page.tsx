import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { getAuthSession } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { isLocale } from "@/lib/locale";
import { getStudentPayments } from "@/lib/services/payment-service";

export default async function StudentPaymentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";
  const session = await getAuthSession();

  if (!session?.user) {
    redirect(`/${safeLocale}/login`);
  }

  const dictionary = await getDictionary(safeLocale);
  const payments = await getStudentPayments(session.user.id);

  return (
    <div className="space-y-6">
      <Card className="p-8">
        <h1 className="text-2xl font-bold text-slate-900">{dictionary.common.dashboard}</h1>
        <p className="mt-3 text-slate-600">
          {safeLocale === "ar" ? "سجل المدفوعات والطلبات." : "Your payment requests and review history."}
        </p>
      </Card>

      <div className="space-y-4">
        {payments.length === 0 ? (
          <Card className="p-8 text-slate-600">
            {safeLocale === "ar" ? "لا توجد طلبات دفع بعد." : "No payment requests yet."}
          </Card>
        ) : null}

        {payments.map((payment) => (
          <Card key={payment.id} className="p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{payment.course.titleAr}</h2>
                <p className="text-sm text-slate-500">{payment.paymentMethod.nameAr}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{payment.status}</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">{safeLocale === "ar" ? "المبلغ" : "Amount"}</p>
                <p className="font-medium text-slate-900">{payment.amount.toString()} {payment.currency}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">{safeLocale === "ar" ? "المرجع" : "Reference"}</p>
                <p className="font-medium text-slate-900">{payment.transactionReference || "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">{safeLocale === "ar" ? "تاريخ الإرسال" : "Submitted"}</p>
                <p className="font-medium text-slate-900">{new Date(payment.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">{safeLocale === "ar" ? "تم المراجعة" : "Reviewed"}</p>
                <p className="font-medium text-slate-900">{payment.reviewedAt ? new Date(payment.reviewedAt).toLocaleDateString() : "—"}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
