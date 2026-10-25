import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileAuth } from "@/lib/mobile/auth";
import { hasCourseAccess } from "@/lib/services/enrollment-service";

type RouteContext = {
  params: Promise<{
    courseId: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext,
) {
  const auth = await getMobileAuth(request);

  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401 },
    );
  }

  if (auth.role !== "STUDENT") {
    return NextResponse.json(
      { message: "Student access required." },
      { status: 403 },
    );
  }

  try {
    const { courseId } = await context.params;

    if (!courseId?.trim()) {
      return NextResponse.json(
        { message: "Course ID is required." },
        { status: 400 },
      );
    }

    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
      include: {
        category: true,
        chapters: {
          orderBy: {
            order: "asc",
          },
          include: {
            lessons: {
              orderBy: {
                order: "asc",
              },
            },
          },
        },
      },
    });

    if (!course || course.status !== "PUBLISHED") {
      return NextResponse.json(
        { message: "Course not found." },
        { status: 404 },
      );
    }

    const hasAccess = await hasCourseAccess(
      auth.userId,
      course.id,
    );

    return NextResponse.json({
      course: {
        id: course.id,
        titleAr: course.titleAr,
        titleEn: course.titleEn,
        slug: course.slug,
        shortDescriptionAr: course.shortDescriptionAr,
        shortDescriptionEn: course.shortDescriptionEn,
        descriptionAr: course.descriptionAr,
        descriptionEn: course.descriptionEn,
        featuresAr: course.featuresAr,
        featuresEn: course.featuresEn,
        outcomesAr: course.outcomesAr,
        outcomesEn: course.outcomesEn,
        benefitsAr: course.benefitsAr,
        benefitsEn: course.benefitsEn,
        price: course.price.toString(),
        thumbnailUrl: course.thumbnailUrl,
        featured: course.featured,
        category: {
          id: course.category.id,
          nameAr: course.category.nameAr,
          nameEn: course.category.nameEn,
          slug: course.category.slug,
        },
        hasAccess,
        chapters: course.chapters.map((chapter) => ({
          id: chapter.id,
          titleAr: chapter.titleAr,
          titleEn: chapter.titleEn,
          descriptionAr: chapter.descriptionAr,
          descriptionEn: chapter.descriptionEn,
          order: chapter.order,
          lessonsCount: chapter.lessons.length,
          lessons: chapter.lessons.map((lesson) => ({
            id: lesson.id,
            titleAr: lesson.titleAr,
            titleEn: lesson.titleEn,
            descriptionAr: lesson.descriptionAr,
            descriptionEn: lesson.descriptionEn,
            order: lesson.order,
            duration: lesson.duration,
            ...(hasAccess
              ? {}
              : {}),
          })),
        })),
      },
    });
  } catch (error) {
    console.error("Mobile course details failed:", error);

    return NextResponse.json(
      { message: "Failed to load course." },
      { status: 500 },
    );
  }
}