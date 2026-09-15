"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConfirmActionButton } from "@/components/admin/confirm-action";
import {
  disableEnrollmentAction,
  reactivateEnrollmentAction,
  type EnrollmentManagementActionState,
} from "@/lib/actions/enrollment-management-actions";
import type { Locale } from "@/lib/locale";

type EnrollmentStatusActionsProps = {
  enrollmentId: string;
  status: string;
  locale: Locale;
};

const initialState: EnrollmentManagementActionState = { status: "idle", message: "" };

export function EnrollmentStatusActions({ enrollmentId, status, locale }: EnrollmentStatusActionsProps) {
  const router = useRouter();
  const [disableState, disableAction, isDisabling] = useActionState(disableEnrollmentAction, initialState);
  const [reactivateState, reactivateAction, isReactivating] = useActionState(reactivateEnrollmentAction, initialState);
  const isArabic = locale === "ar";
  const feedback = disableState.message || reactivateState.message;
  const feedbackIsError = disableState.status === "error" || reactivateState.status === "error";
  const isSubmitting = isDisabling || isReactivating;

  useEffect(() => {
    if (disableState.status === "success" || reactivateState.status === "success") {
      router.refresh();
    }
  }, [disableState.status, reactivateState.status, router]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "ACTIVE" ? (
        <form action={disableAction}>
          <input type="hidden" name="enrollmentId" value={enrollmentId} />
          <input type="hidden" name="locale" value={locale} />
          <ConfirmActionButton
            type="submit"
            size="sm"
            variant="outline"
            disabled={isSubmitting}
            confirmText={isArabic ? "هل أنت متأكد من تعطيل هذا الاشتراك؟" : "Are you sure you want to disable this enrollment?"}
          >
            {isDisabling ? (isArabic ? "جارٍ التعطيل..." : "Disabling...") : isArabic ? "تعطيل الاشتراك" : "Disable enrollment"}
          </ConfirmActionButton>
        </form>
      ) : status === "SUSPENDED" ? (
        <form action={reactivateAction}>
          <input type="hidden" name="enrollmentId" value={enrollmentId} />
          <input type="hidden" name="locale" value={locale} />
          <ConfirmActionButton
            type="submit"
            size="sm"
            disabled={isSubmitting}
            confirmText={isArabic ? "هل أنت متأكد من إعادة تفعيل هذا الاشتراك؟" : "Are you sure you want to reactivate this enrollment?"}
          >
            {isReactivating ? (isArabic ? "جارٍ التفعيل..." : "Reactivating...") : isArabic ? "إعادة تفعيل الاشتراك" : "Reactivate enrollment"}
          </ConfirmActionButton>
        </form>
      ) : null}
      {feedback ? <p className={`basis-full text-xs ${feedbackIsError ? "text-red-600" : "text-emerald-700"}`}>{feedback}</p> : null}
    </div>
  );
}
