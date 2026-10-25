"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createEnrollmentRequestAction,
  type EnrollmentRequestActionState,
} from "@/lib/actions/enrollment-request-actions";
import type { Locale } from "@/lib/locale";

type EnrollmentRequestFormProps = {
  courseId: string;
  courseName: string;
  email: string;
  locale: Locale;
};

const initialState: EnrollmentRequestActionState = { status: "idle", message: "" };

export function EnrollmentRequestForm({ courseId, courseName, email, locale }: EnrollmentRequestFormProps) {
  const [state, formAction, isPending] = useActionState(createEnrollmentRequestAction, initialState);
  const isArabic = locale === "ar";

  return (
    <form action={formAction} encType="multipart/form-data" className="mt-6 grid gap-4 md:grid-cols-2">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="locale" value={locale} />
      <div className="space-y-2">
        <Label htmlFor="fullName">{isArabic ? "الاسم الرباعي" : "Full name"}</Label>
        <Input id="fullName" name="fullName" required maxLength={160} placeholder={isArabic ? "أدخل الاسم الرباعي" : "Enter your full name"} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{isArabic ? "البريد الإلكتروني" : "Email"}</Label>
        <Input id="email" name="email" type="email" required defaultValue={email} readOnly maxLength={320} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="transferWalletNumber">{isArabic ? "رقم المحفظة التي تم التحويل منها" : "Wallet number used for transfer"}</Label>
        <Input id="transferWalletNumber" name="transferWalletNumber" required maxLength={80} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="personalPhoneNumber">{isArabic ? "رقم الهاتف الشخصي" : "Personal phone number"}</Label>
        <Input id="personalPhoneNumber" name="personalPhoneNumber" type="tel" required maxLength={40} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="courseName">{isArabic ? "اسم الدورة" : "Course name"}</Label>
        <Input id="courseName" value={courseName} readOnly aria-readonly="true" />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="receipt">{isArabic ? "صورة إيصال التحويل" : "Payment receipt image"}</Label>
        <Input
  id="receipt"
  name="receipt"
  type="file"
  accept="image/jpeg,image/png,image/webp"
  required
  onChange={(event) => {
    const file = event.target.files?.[0];

    if (file && file.size > 2 * 1024 * 1024) {
      event.target.value = "";
      window.alert(
        isArabic
          ? "حجم صورة الإيصال يجب ألا يتجاوز 2 ميجابايت."
          : "Receipt image must not exceed 2 MB.",
      );
    }
  }}
/>
        <p className="text-xs text-slate-500">
          {isArabic ? "صورة JPG أو PNG أو WEBP، بحد أقصى 2 ميجابايت." : "JPG, PNG, or WEBP image, maximum 2 MB."}
        </p>
      </div>
      {state.message ? (
        <p className={`text-sm md:col-span-2 ${state.status === "success" ? "text-emerald-700" : "text-red-600"}`}>
          {state.status === "success"
            ? isArabic
              ? "تم إرسال طلب الاشتراك بنجاح، وسيتم مراجعته من الإدارة. الحالة: قيد المراجعة"
              : "Your enrollment request was submitted successfully and will be reviewed by the administration. Status: Under review"
            : state.message}
        </p>
      ) : null}
      <div className="md:col-span-2">
        <Button type="submit" disabled={isPending} className="min-h-11">
          {isPending ? (isArabic ? "جارٍ الإرسال..." : "Submitting...") : isArabic ? "إرسال طلب الاشتراك" : "Submit enrollment request"}
        </Button>
      </div>
    </form>
  );
}
