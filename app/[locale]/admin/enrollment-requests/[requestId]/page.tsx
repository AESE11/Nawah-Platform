import Link from "next/link";
import Image from "next/image";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";
import { EnrollmentRequestReviewForm } from "@/components/admin/enrollment-request-review-form";
import { Card } from "@/components/ui/card";
import { isLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";

function formatStatus(status: string, arabic: boolean) {
  if (status === "PENDING") return arabic ? "قيد المراجعة" : "Pending";
  if (status === "APPROVED") return arabic ? "مقبول" : "Approved";
  return arabic ? "مرفوض" : "Rejected";
}

export default async function AdminEnrollmentRequestDetailPage({
  params,
}: {
  params: Promise<{ locale: string; requestId: string }>;
}) {
  const { locale, requestId } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";
  const arabic = safeLocale === "ar";
  const request = await prisma.enrollmentRequest.findUnique({
    where: { id: requestId },
    include: { user: true, course: true },
  });

  if (!request) {
    return <Card className="p-8 text-slate-600">{arabic ? "الطلب غير موجود." : "Request not found."}</Card>;
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs locale={safeLocale} items={[{ href: "/admin/enrollment-requests", label: arabic ? "طلبات الاشتراك" : "Enrollment requests" }, { label: request.fullName }]} />
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{request.fullName}</h1>
            <p className="mt-1 text-sm text-slate-600">{request.email}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{formatStatus(request.status, arabic)}</span>
        </div>

        <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div><p className="text-slate-500">{arabic ? "البريد الإلكتروني" : "Email"}</p><p className="font-medium text-slate-900">{request.email}</p></div>
          <div><p className="text-slate-500">{arabic ? "الهاتف الشخصي" : "Personal phone"}</p><p className="font-medium text-slate-900">{request.personalPhoneNumber}</p></div>
          <div><p className="text-slate-500">{arabic ? "محفظة التحويل" : "Transfer wallet"}</p><p className="font-medium text-slate-900">{request.transferWalletNumber}</p></div>
          <div><p className="text-slate-500">{arabic ? "الدورة" : "Course"}</p><p className="font-medium text-slate-900">{arabic ? request.course.titleAr : request.course.titleEn}</p></div>
          <div><p className="text-slate-500">{arabic ? "المبلغ" : "Course price"}</p><p className="font-medium text-slate-900">{request.coursePrice.toString()} {request.currency}</p></div>
          <div><p className="text-slate-500">{arabic ? "تاريخ الطلب" : "Submitted"}</p><p className="font-medium text-slate-900">{request.createdAt.toLocaleString()}</p></div>
          <div><p className="text-slate-500">{arabic ? "تاريخ المراجعة" : "Reviewed"}</p><p className="font-medium text-slate-900">{request.reviewedAt?.toLocaleString() ?? "-"}</p></div>
          <div><p className="text-slate-500">{arabic ? "المراجع" : "Reviewer"}</p><p className="font-medium text-slate-900">{request.reviewedBy ?? "-"}</p></div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">{arabic ? "إيصال التحويل" : "Transfer receipt"}</p>
          <a href={request.receiptUrl} target="_blank" rel="noreferrer" className="mt-3 block">
            <div className="relative h-[32rem] w-full">
              <Image src={request.receiptUrl} alt={arabic ? "صورة إيصال التحويل" : "Transfer receipt"} fill unoptimized className="rounded-xl object-contain" />
            </div>
          </a>
        </div>

        {request.adminNotes ? (
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            <p className="font-semibold text-slate-900">{arabic ? "ملاحظات الإدارة" : "Admin notes"}</p>
            <p className="mt-1 whitespace-pre-wrap">{request.adminNotes}</p>
          </div>
        ) : null}

        <EnrollmentRequestReviewForm locale={safeLocale} requestId={request.id} pending={request.status === "PENDING"} />
      </Card>
      <Link href={`/${safeLocale}/admin/enrollment-requests`} className="text-sm font-medium text-teal-700 hover:text-teal-900">
        {arabic ? "العودة إلى الطلبات" : "Back to requests"}
      </Link>
    </div>
  );
}
