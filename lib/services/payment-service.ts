import { prisma } from "@/lib/prisma";

export async function getPaymentMethods() {
  return prisma.paymentMethod.findMany({
    where: { enabled: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function getStudentPayments(userId: string) {
  return prisma.payment.findMany({
    where: { userId },
    include: {
      course: true,
      paymentMethod: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPendingPayments() {
  return prisma.payment.findMany({
    where: { status: "PENDING" },
    include: {
      user: true,
      course: true,
      paymentMethod: true,
    },
    orderBy: { createdAt: "asc" },
  });
}
