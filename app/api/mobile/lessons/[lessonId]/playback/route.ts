import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileAuth } from "@/lib/mobile/auth";
import { getActiveEnrollmentForCourse } from "@/lib/services/enrollment-service";
import { checkVideoTokenRateLimit } from "@/lib/security/video-token-rate-limit";
import { logVideoSecurityEvent } from "@/lib/security/video-security-log";
import { getVcdnPlaybackConfig } from "@/lib/vcdn";
import { getStudentWatermarkId } from "@/lib/watermark";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const { lessonId } = await params;

  const auth = await getMobileAuth(request);

  if (!auth) {
    logVideoSecurityEvent({
      event: "access_denied",
      result: "denied",
      lessonId,
      errorCategory: "authentication",
    });

    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 },
    );
  }

  if (auth.role !== "STUDENT") {
    logVideoSecurityEvent({
      event: "access_denied",
      result: "denied",
      userId: auth.userId,
      lessonId,
      errorCategory: "role",
    });

    return NextResponse.json(
      { message: "Access denied" },
      { status: 403 },
    );
  }

  let rateLimit;

  try {
    rateLimit = await checkVideoTokenRateLimit(auth.userId);
  } catch {
    console.error("Video token rate limiter unavailable.");
    logVideoSecurityEvent({
      event: "access_denied",
      result: "failed",
      userId: auth.userId,
      lessonId,
      errorCategory: "rate_limit",
    });

    return NextResponse.json(
      { message: "Video playback is temporarily unavailable" },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  if (!rateLimit.allowed) {
    logVideoSecurityEvent({
      event: "rate_limited",
      result: "denied",
      userId: auth.userId,
      lessonId,
      errorCategory: "rate_limit",
    });

    return NextResponse.json(
      { message: "Too many requests" },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      chapter: {
        select: {
          courseId: true,
        },
      },
    },
  });

  if (!lesson) {
    logVideoSecurityEvent({
      event: "invalid_lesson",
      result: "denied",
      userId: auth.userId,
      lessonId,
      errorCategory: "lesson",
    });

    return NextResponse.json(
      { message: "Lesson not found" },
      { status: 404 },
    );
  }

  const activeEnrollment = await getActiveEnrollmentForCourse(
    auth.userId,
    lesson.chapter.courseId,
  );

  if (!activeEnrollment) {
    logVideoSecurityEvent({
      event: "access_denied",
      result: "denied",
      userId: auth.userId,
      lessonId,
      courseId: lesson.chapter.courseId,
      errorCategory: "enrollment",
    });

    return NextResponse.json(
      { message: "Access denied" },
      { status: 403 },
    );
  }

  if (!lesson.vcdnVideoId) {
    logVideoSecurityEvent({
      event: "access_denied",
      result: "denied",
      userId: auth.userId,
      lessonId,
      courseId: lesson.chapter.courseId,
      errorCategory: "playback_configuration",
    });

    return NextResponse.json(
      { message: "Video is not configured for this lesson" },
      { status: 404 },
    );
  }

  try {
    const playback = await getVcdnPlaybackConfig(
      lesson.vcdnVideoId,
    );
    const watermarkId = getStudentWatermarkId(auth.userId);

    logVideoSecurityEvent({
      event: "token_issued",
      result: "allowed",
      userId: auth.userId,
      lessonId,
      courseId: lesson.chapter.courseId,
    });

    return NextResponse.json(
      {
        lessonId: lesson.id,
        courseId: lesson.chapter.courseId,
        authorized: true,
        mode: playback.mode,
        streamUrl: playback.streamUrl,
        expires: playback.expires ?? null,
        watermarkId,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("VCDN playback error:", error);

    logVideoSecurityEvent({
      event: "access_denied",
      result: "denied",
      userId: auth.userId,
      lessonId,
      courseId: lesson.chapter.courseId,
      errorCategory: "playback_configuration",
    });

    return NextResponse.json(
      { message: "Unable to authorize video playback" },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}