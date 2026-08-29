import { prisma } from "@/lib/prisma";

export async function getAdminOverview() {
  const [courseCount, pendingPayments, activeEnrollments, studentCount, revenueResult] = await Promise.all([
    prisma.course.count(),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.enrollment.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "APPROVED" },
    }),
  ]);

  return {
    courseCount,
    pendingPayments,
    activeEnrollments,
    studentCount,
    revenue: Number(revenueResult._sum.amount ?? 0),
  };
}

export async function getAdminCourses() {
  return prisma.course.findMany({
    include: {
      category: true,
      chapters: {
        include: {
          lessons: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminPayments() {
  return prisma.payment.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      course: true,
      paymentMethod: true,
      reviewedUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminEnrollments() {
  return prisma.enrollment.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      course: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          enrollments: true,
          payments: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 25,
  });
}
