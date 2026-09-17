import Link from "next/link";
import { ExportButtons } from "@/components/admin/export-buttons";
import { Card } from "@/components/ui/card";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";
import { isLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";

const statuses = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const;
type RequestStatusFilter = (typeof statuses)[number];

function getStatusLabel(status: RequestStatusFilter, arabic: boolean) {
  if (status === "ALL") return arabic ? "الكل" : "All";
  if (status === "PENDING") return arabic ? "قيد المراجعة" : "Pending";
  if (status === "APPROVED") return arabic ? "مقبول" : "Approved";
  return arabic ? "مرفوض" : "Rejected";
}

function getRequestStatusLabel(status: string, arabic: boolean) {
  return getStatusLabel(status as RequestStatusFilter, arabic);
}

export default async function AdminEnrollmentRequestsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";
  const arabic = safeLocale === "ar";
  const requestedStatus = (await searchParams)?.status?.toUpperCase();
  const status: RequestStatusFilter = statuses.includes(requestedStatus as RequestStatusFilter)
    ? requestedStatus as RequestStatusFilter
    : "PENDING";

  const requests = await prisma.enrollmentRequest.findMany({
    where: status === "ALL" ? undefined : { status },
    include: { user: true, course: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs locale={safeLocale} items={[{ label: arabic ? "طلبات الاشتراك" : "Enrollment requests" }]} />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{arabic ? "طلبات الاشتراك" : "Enrollment requests"}</h1>
        <p className="mt-2 text-sm text-slate-600">{arabic ? "راجع طلبات الطلاب وفعّل الاشتراك بعد التحقق من الدفع." : "Review student requests and activate enrollment after payment verification."}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {statuses.map((item) => (
          <Link
            key={item}
            href={`/${safeLocale}/admin/enrollment-requests?status=${item}`}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${status === item ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
          >
            {getStatusLabel(item, arabic)}
          </Link>
        ))}
      </div>

            <ExportButtons
        endpoint={`/${safeLocale}/api/admin/exports/enrollment-requests?status=${status}`}
        googleSheetsEndpoint={`/${safeLocale}/api/admin/exports/enrollment-requests/google-sheets?status=${status}`}
        labels={{
          excel: arabic ? "تصدير Excel" : "Export Excel",
          csv: arabic ? "تصدير CSV" : "Export CSV",
          googleSheets: arabic
            ? "تصدير إلى Google Sheets"
            : "Export to Google Sheets",
        }}
      />

      {requests.length === 0 ? (
        <Card className="p-8 text-slate-600">{arabic ? "لا توجد طلبات في هذه الحالة." : "No requests found for this status."}</Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{request.fullName}</h2>
                  <p className="text-sm text-slate-600">{request.email}</p>
                  <p className="mt-2 font-medium text-slate-800">{arabic ? request.course.titleAr : request.course.titleEn}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{getRequestStatusLabel(request.status, arabic)}</span>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                <span>{arabic ? "المبلغ" : "Price"}: {request.coursePrice.toString()} {request.currency}</span>
                <span>{arabic ? "محفظة التحويل" : "Transfer wallet"}: {request.transferWalletNumber}</span>
                <span>{arabic ? "الهاتف" : "Phone"}: {request.personalPhoneNumber}</span>
                <span>{arabic ? "تاريخ الطلب" : "Submitted"}: {request.createdAt.toLocaleDateString()}</span>
              </div>
              <div className="mt-4">
                <Link href={`/${safeLocale}/admin/enrollment-requests/${request.id}`} className="text-sm font-medium text-teal-700 hover:text-teal-900">
                  {arabic ? "عرض التفاصيل" : "View details"}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
