import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export async function ensureAdminAccess(locale = "ar") {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  if (session.user.role !== "ADMIN") {
    redirect(`/${locale}/login`);
  }

  return session.user;
}

export async function getPublishedCourses() {
  return prisma.course.findMany({
    where: { status: "PUBLISHED" },
    include: {
      category: true,
      chapters: {
        include: {
          lessons: true,
        },
      },
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
}

export async function getCourseBySlug(slug: string, locale: "ar" | "en" = "ar") {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      category: true,
      chapters: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!course || course.status !== "PUBLISHED") {
    return null;
  }

  void locale;
  return course;
}

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { nameAr: "asc" },
  });
}
