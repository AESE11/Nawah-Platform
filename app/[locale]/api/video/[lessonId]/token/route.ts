import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveEnrollmentForCourse } from "@/lib/services/enrollment-service";
import { generateMuxPlaybackToken, normalizePlaybackId } from "@/lib/mux";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; lessonId: string }> },
) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      chapter: {
        include: {
          course: true,
        },
      },
    },
  });

  if (!lesson) {
    return NextResponse.json({ message: "Lesson not found" }, { status: 404 });
  }

  const activeEnrollment = await getActiveEnrollmentForCourse(session.user.id, lesson.chapter.courseId);

  if (!activeEnrollment) {
    return NextResponse.json({ message: "Access denied" }, { status: 403 });
  }

  if (!lesson.muxPlaybackId) {
    return NextResponse.json({ message: "Video not configured" }, { status: 409 });
  }

  try {
    const playbackId = normalizePlaybackId(lesson.muxPlaybackId);
    const token = await generateMuxPlaybackToken(playbackId, { expiration: "1h" });

    return NextResponse.json({
      token,
      playbackId,
    });
  } catch {
    return NextResponse.json({ message: "Video unavailable" }, { status: 409 });
  }
}
