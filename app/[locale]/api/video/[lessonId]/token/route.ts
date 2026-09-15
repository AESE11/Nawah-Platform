import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveEnrollmentForCourse } from "@/lib/services/enrollment-service";
import { generateMuxPlaybackToken, normalizePlaybackId } from "@/lib/mux";
import { checkVideoTokenRateLimit } from "@/lib/security/video-token-rate-limit";
import { logVideoSecurityEvent } from "@/lib/security/video-security-log";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; lessonId: string }> },
) {
  const { lessonId } = await params;
  const session = await getAuthSession();

  if (!session?.user) {
    logVideoSecurityEvent({ event: "access_denied", result: "denied", lessonId, errorCategory: "authentication" });
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "STUDENT") {
    logVideoSecurityEvent({ event: "access_denied", result: "denied", userId: session.user.id, lessonId, errorCategory: "role" });
    return NextResponse.json({ message: "Access denied" }, { status: 403 });
  }

  const rateLimit = checkVideoTokenRateLimit(session.user.id);

  if (!rateLimit.allowed) {
    logVideoSecurityEvent({ event: "rate_limited", result: "denied", userId: session.user.id, lessonId, errorCategory: "rate_limit" });
    return NextResponse.json(
      { message: "Too many requests" },
      { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

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
    logVideoSecurityEvent({ event: "invalid_lesson", result: "denied", userId: session.user.id, lessonId, errorCategory: "lesson" });
    return NextResponse.json({ message: "Lesson not found" }, { status: 404 });
  }

  const activeEnrollment = await getActiveEnrollmentForCourse(session.user.id, lesson.chapter.courseId);

  if (!activeEnrollment) {
    logVideoSecurityEvent({ event: "access_denied", result: "denied", userId: session.user.id, lessonId, courseId: lesson.chapter.courseId, errorCategory: "enrollment" });
    return NextResponse.json({ message: "Access denied" }, { status: 403 });
  }

  if (!lesson.muxPlaybackId) {
    logVideoSecurityEvent({ event: "access_denied", result: "denied", userId: session.user.id, lessonId, courseId: lesson.chapter.courseId, errorCategory: "playback_configuration" });
    return NextResponse.json({ message: "Video not configured" }, { status: 409 });
  }

  try {
    const playbackId = normalizePlaybackId(lesson.muxPlaybackId);
    const token = await generateMuxPlaybackToken(playbackId);

    logVideoSecurityEvent({ event: "token_issued", result: "allowed", userId: session.user.id, lessonId, courseId: lesson.chapter.courseId });

    return NextResponse.json({
      token,
      playbackId,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    logVideoSecurityEvent({ event: "token_generation_failed", result: "failed", userId: session.user.id, lessonId, courseId: lesson.chapter.courseId, errorCategory: "token_generation" });
    return NextResponse.json({ message: "Video unavailable" }, { status: 503 });
  }
}
