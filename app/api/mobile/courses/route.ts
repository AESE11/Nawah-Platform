
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileAuth } from "@/lib/mobile/auth";

export async function GET(request: Request) {
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
    const courses = await prisma.course.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: [
        { featured: "desc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        titleAr: true,
        titleEn: true,
        slug: true,
        shortDescriptionAr: true,
        shortDescriptionEn: true,
        price: true,
        thumbnailUrl: true,
        featured: true,
        category: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      courses: courses.map((course) => ({
        ...course,
        price: course.price.toString(),
      })),
    });
  } catch (error) {
    console.error("Mobile public courses failed:", error);

    return NextResponse.json(
      { message: "Failed to load courses." },
      { status: 500 },
    );
  }
}
