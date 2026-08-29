"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { paymentMethodSchema } from "@/lib/validation/payment";
import { ensureAdminAccess } from "@/lib/content";

function normalizeText(value: FormDataEntryValue | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export async function createPaymentMethodAction(formData: FormData, locale: string) {
  await ensureAdminAccess(locale);

  const payload = {
    id: normalizeText(formData.get("id")) || undefined,
    nameAr: normalizeText(formData.get("nameAr")),
    nameEn: normalizeText(formData.get("nameEn")),
    instructionsAr: normalizeText(formData.get("instructionsAr")),
    instructionsEn: normalizeText(formData.get("instructionsEn")),
    accountDetailsAr: normalizeText(formData.get("accountDetailsAr")),
    accountDetailsEn: normalizeText(formData.get("accountDetailsEn")),
    enabled: formData.get("enabled") === "on" || formData.get("enabled") === "true",
    sortOrder: normalizeText(formData.get("sortOrder")) || "0",
  };

  const parsed = paymentMethodSchema.parse(payload);

  const paymentMethod = await prisma.paymentMethod.create({
    data: {
      ...parsed,
      enabled: Boolean(parsed.enabled),
      sortOrder: Number(parsed.sortOrder),
      instructionsAr: parsed.instructionsAr || null,
      instructionsEn: parsed.instructionsEn || null,
      accountDetailsAr: parsed.accountDetailsAr || null,
      accountDetailsEn: parsed.accountDetailsEn || null,
    },
  });

  revalidatePath(`/${locale}/admin/payment-methods`);
  revalidatePath(`/${locale}/admin`);
  return paymentMethod;
}

export async function updatePaymentMethodAction(formData: FormData, locale: string) {
  await ensureAdminAccess(locale);

  const id = normalizeText(formData.get("paymentMethodId"));
  const payload = {
    id,
    nameAr: normalizeText(formData.get("nameAr")),
    nameEn: normalizeText(formData.get("nameEn")),
    instructionsAr: normalizeText(formData.get("instructionsAr")),
    instructionsEn: normalizeText(formData.get("instructionsEn")),
    accountDetailsAr: normalizeText(formData.get("accountDetailsAr")),
    accountDetailsEn: normalizeText(formData.get("accountDetailsEn")),
    enabled: formData.get("enabled") === "on" || formData.get("enabled") === "true",
    sortOrder: normalizeText(formData.get("sortOrder")) || "0",
  };

  const parsed = paymentMethodSchema.parse(payload);

  const paymentMethod = await prisma.paymentMethod.update({
    where: { id },
    data: {
      ...parsed,
      enabled: Boolean(parsed.enabled),
      sortOrder: Number(parsed.sortOrder),
      instructionsAr: parsed.instructionsAr || null,
      instructionsEn: parsed.instructionsEn || null,
      accountDetailsAr: parsed.accountDetailsAr || null,
      accountDetailsEn: parsed.accountDetailsEn || null,
    },
  });

  revalidatePath(`/${locale}/admin/payment-methods`);
  revalidatePath(`/${locale}/admin`);
  return paymentMethod;
}

export async function deletePaymentMethodAction(formData: FormData, locale: string) {
  await ensureAdminAccess(locale);

  const id = normalizeText(formData.get("paymentMethodId"));

  const paymentCount = await prisma.payment.count({ where: { paymentMethodId: id } });
  if (paymentCount > 0) {
    throw new Error("This payment method has existing payment records and cannot be deleted.");
  }

  await prisma.paymentMethod.delete({ where: { id } });

  revalidatePath(`/${locale}/admin/payment-methods`);
  revalidatePath(`/${locale}/admin`);
}
