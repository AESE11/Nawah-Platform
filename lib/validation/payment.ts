import { z } from "zod";

export const paymentMethodSchema = z.object({
  id: z.string().trim().min(1).optional().or(z.literal("")),
  nameAr: z.string().trim().min(1),
  nameEn: z.string().trim().min(1),
  instructionsAr: z.string().trim().max(2000).optional().or(z.literal("")),
  instructionsEn: z.string().trim().max(2000).optional().or(z.literal("")),
  accountDetailsAr: z.string().trim().max(2000).optional().or(z.literal("")),
  accountDetailsEn: z.string().trim().max(2000).optional().or(z.literal("")),
  enabled: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const paymentRequestSchema = z.object({
  courseId: z.string().trim().min(1, "Course is required."),
  paymentMethodId: z.string().trim().min(1, "Payment method is required."),
  transactionReference: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const paymentProofSchema = z.object({
  proofUrl: z.string().trim().url("Proof must be a valid URL."),
  proofPublicId: z.string().trim().max(255).optional().or(z.literal("")),
});

export const paymentReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "CANCELLED"]),
  adminNotes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const enrollmentSchema = z.object({
  courseId: z.string().trim().min(1, "Course is required."),
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED", "CANCELLED", "COMPLETED"]).default("PENDING"),
});

export const enrollmentRequestSchema = z.object({
  courseId: z.string().trim().min(1, "Course is required."),
  fullName: z.string().trim().min(2, "Full name is required.").max(160),
  email: z.string().trim().email("A valid email is required.").max(320),
  transferWalletNumber: z.string().trim().min(3, "Transfer wallet number is required.").max(80),
  personalPhoneNumber: z.string().trim().min(5, "Personal phone number is required.").max(40),
});

export const enrollmentRequestReviewSchema = z.object({
  requestId: z.string().trim().min(1, "Request is required."),
  adminNotes: z.string().trim().max(2000).optional().or(z.literal("")),
});
