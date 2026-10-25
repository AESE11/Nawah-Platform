import { NextResponse } from "next/server";
import { getMobileAuth } from "@/lib/mobile/auth";
import { getStudentEnrollments } from "@/lib/services/enrollment-service";

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
    const enrollments = await getStudentEnrollments(auth.userId);

    const courses = enrollments.map((enrollment) => ({
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        expiresAt: enrollment.expiresAt,
      },
      course: {
        id: enrollment.course.id,
        titleAr: enrollment.course.titleAr,
        titleEn: enrollment.course.titleEn,
        slug: enrollment.course.slug,
        shortDescriptionAr: enrollment.course.shortDescriptionAr,
        shortDescriptionEn: enrollment.course.shortDescriptionEn,
        thumbnailUrl: enrollment.course.thumbnailUrl,
        price: enrollment.course.price.toString(),
        status: enrollment.course.status,
        featured: enrollment.course.featured,
      },
    }));

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Mobile student courses failed:", error);

    return NextResponse.json(
      { message: "Failed to load courses." },
      { status: 500 },
    );
  }
}