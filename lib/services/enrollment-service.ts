import { prisma } from "@/lib/prisma";

export async function getStudentEnrollments(userId: string) {
  return prisma.enrollment.findMany({
    where: { userId },
    include: { course: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getActiveEnrollmentForCourse(userId: string, courseId: string) {
  return prisma.enrollment.findFirst({
    where: {
      userId,
      courseId,
      status: "ACTIVE",
    },
  });
}

export async function hasCourseAccess(userId: string, courseId: string) {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  return Boolean(enrollment);
}
