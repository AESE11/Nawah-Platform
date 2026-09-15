"use server";

import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export type EnrollmentManagementActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const enrollmentIdSchema = z.object({
  enrollmentId: z.string().trim().min(1),
  locale: z.enum(["ar", "en"]),
});

function getValues(formData: FormData) {
  return enrollmentIdSchema.safeParse({
    enrollmentId: typeof formData.get("enrollmentId") === "string" ? formData.get("enrollmentId") : "",
    locale: typeof formData.get("locale") === "string" ? formData.get("locale") : "ar",
  });
}

async function getAdmin() {
  const session = await getAuthSession();
  return session?.user?.role === "ADMIN" ? session.user : null;
}

export async function disableEnrollmentAction(
  _previousState: EnrollmentManagementActionState,
  formData: FormData,
): Promise<EnrollmentManagementActionState> {
  const values = getValues(formData);
  const locale = values.success && values.data.locale === "ar" ? "ar" : "en";
  const admin = await getAdmin();

  if (!admin) {
    return { status: "error", message: locale === "ar" ? "غير مصرح لك بتنفيذ هذا الإجراء." : "You are not authorized to perform this action." };
  }

  if (!values.success) {
    return { status: "error", message: locale === "ar" ? "معرف الاشتراك غير صالح." : "The enrollment ID is invalid." };
  }

  const result = await prisma.enrollment.updateMany({
    where: { id: values.data.enrollmentId, status: "ACTIVE" },
    data: { status: "SUSPENDED" },
  });

  if (result.count !== 1) {
    return { status: "error", message: locale === "ar" ? "الاشتراك غير موجود أو تم تعطيله مسبقًا." : "The enrollment was not found or is already disabled." };
  }

  revalidatePath(`/${locale}/admin/students`);
  revalidatePath(`/${locale}/admin/students/[userId]`, "page");
  revalidatePath(`/${locale}/dashboard/courses`);
  return { status: "success", message: locale === "ar" ? "تم تعطيل الاشتراك بنجاح." : "Enrollment disabled successfully." };
}

export async function reactivateEnrollmentAction(
  _previousState: EnrollmentManagementActionState,
  formData: FormData,
): Promise<EnrollmentManagementActionState> {
  const values = getValues(formData);
  const locale = values.success && values.data.locale === "ar" ? "ar" : "en";
  const admin = await getAdmin();

  if (!admin) {
    return { status: "error", message: locale === "ar" ? "غير مصرح لك بتنفيذ هذا الإجراء." : "You are not authorized to perform this action." };
  }

  if (!values.success) {
    return { status: "error", message: locale === "ar" ? "معرف الاشتراك غير صالح." : "The enrollment ID is invalid." };
  }

  const result = await prisma.enrollment.updateMany({
    where: { id: values.data.enrollmentId, status: "SUSPENDED" },
    data: { status: "ACTIVE" },
  });

  if (result.count !== 1) {
    return { status: "error", message: locale === "ar" ? "الاشتراك غير موجود أو مفعل بالفعل." : "The enrollment was not found or is already active." };
  }

  revalidatePath(`/${locale}/admin/students`);
  revalidatePath(`/${locale}/admin/students/[userId]`, "page");
  revalidatePath(`/${locale}/dashboard/courses`);
  return { status: "success", message: locale === "ar" ? "تم إعادة تفعيل الاشتراك بنجاح." : "Enrollment reactivated successfully." };
}
