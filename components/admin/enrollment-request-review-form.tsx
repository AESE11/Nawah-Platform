"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmActionButton } from "@/components/admin/confirm-action";
import {
  approveEnrollmentRequestAction,
  rejectEnrollmentRequestAction,
  type EnrollmentRequestReviewState,
} from "@/lib/actions/enrollment-request-review-actions";
import type { Locale } from "@/lib/locale";

type EnrollmentRequestReviewFormProps = {
  locale: Locale;
  requestId: string;
  pending: boolean;
};

const initialState: EnrollmentRequestReviewState = { status: "idle", message: "" };

export function EnrollmentRequestReviewForm({ locale, requestId, pending }: EnrollmentRequestReviewFormProps) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [approveState, approveAction, isApproving] = useActionState(approveEnrollmentRequestAction, initialState);
  const [rejectState, rejectAction, isRejecting] = useActionState(rejectEnrollmentRequestAction, initialState);
  const isArabic = locale === "ar";
  const isPending = isApproving || isRejecting;
  const feedback = approveState.message || rejectState.message;
  const feedbackStatus = approveState.status === "error" || rejectState.status === "error" ? "error" : "success";

  useEffect(() => {
    if (approveState.status === "success" || rejectState.status === "success") {
      router.refresh();
    }
  }, [approveState.status, rejectState.status, router]);

  return (
    <div className="mt-6 border-t border-slate-200 pt-6">
      <label className="block space-y-2 text-sm font-medium text-slate-700">
        <span>{isArabic ? "ملاحظات المراجعة" : "Review notes"}</span>
        <textarea
          name="adminNotes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={2000}
          rows={4}
          placeholder={isArabic ? "مثال: تم التحقق من الإيصال." : "Example: Receipt verified."}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400"
        />
      </label>

      {pending ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <form action={approveAction}>
            <input type="hidden" name="requestId" value={requestId} />
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="adminNotes" value={notes} />
            <ConfirmActionButton type="submit" disabled={isPending} confirmText={isArabic ? "هل تريد الموافقة على هذا الطلب وتفعيل الاشتراك؟" : "Approve this request and activate enrollment?"}>
              {isApproving ? (isArabic ? "جارٍ التنفيذ..." : "Approving...") : isArabic ? "الموافقة وتفعيل الاشتراك" : "Approve and activate"}
            </ConfirmActionButton>
          </form>
          <form action={rejectAction}>
            <input type="hidden" name="requestId" value={requestId} />
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="adminNotes" value={notes} />
            <ConfirmActionButton type="submit" variant="outline" disabled={isPending} confirmText={isArabic ? "هل تريد رفض هذا الطلب؟" : "Reject this request?"}>
              {isRejecting ? (isArabic ? "جارٍ التنفيذ..." : "Rejecting...") : isArabic ? "رفض الطلب" : "Reject request"}
            </ConfirmActionButton>
          </form>
        </div>
      ) : null}

      {feedback ? <p className={`mt-4 text-sm ${feedbackStatus === "error" ? "text-red-600" : "text-emerald-700"}`}>{feedback}</p> : null}
    </div>
  );
}
