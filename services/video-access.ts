import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getActiveEnrollmentForCourse } from "@/lib/services/enrollment-service";
import { generateMuxPlaybackToken, getMuxPlaybackTokenLifetimeMs, normalizeMuxPlaybackTokenTtl, normalizePlaybackId } from "@/lib/mux";

export interface LessonAccessEvaluationInput {
  userId?: string | null;
  courseId?: string | null;
  lessonId?: string | null;
  lessonCourseId?: string | null;
  enrollmentStatus?: string | null;
  hasActiveEnrollment?: boolean;
  hasPlaybackId?: boolean;
  lessonExists?: boolean;
  playbackId?: string | null;
}

export interface LessonAccessEvaluationResult {
  authorized: boolean;
  status: number;
  reason: string;
  courseId?: string;
  lessonId?: string;
  playbackId?: string;
}

export function evaluateLessonAccess(input: LessonAccessEvaluationInput): LessonAccessEvaluationResult {
  if (!input.userId) {
    return { authorized: false, status: 401, reason: "Authentication is required." };
  }

  if (!input.lessonExists) {
    return { authorized: false, status: 404, reason: "Lesson not found." };
  }

  if (input.lessonCourseId && input.courseId && input.lessonCourseId !== input.courseId) {
    return {
      authorized: false,
      status: 403,
      reason: "This lesson does not belong to the requested course.",
    };
  }

  if (!input.hasActiveEnrollment) {
    return {
      authorized: false,
      status: 403,
      reason: "You do not have an active enrollment for this course.",
    };
  }

  if (!input.hasPlaybackId || !input.playbackId) {
    return {
      authorized: false,
      status: 409,
      reason: "This lesson is not configured for protected playback.",
    };
  }

  return {
    authorized: true,
    status: 200,
    reason: "Lesson access authorized.",
    courseId: input.courseId || input.lessonCourseId || undefined,
    lessonId: input.lessonId || undefined,
    playbackId: input.playbackId || undefined,
  };
}

export async function canAccessLesson(userId: string, lessonId: string) {
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
    return evaluateLessonAccess({
      userId,
      lessonId,
      lessonExists: false,
    });
  }

  const activeEnrollment = await getActiveEnrollmentForCourse(userId, lesson.chapter.courseId);

  return evaluateLessonAccess({
    userId,
    lessonId,
    courseId: lesson.chapter.courseId,
    lessonCourseId: lesson.chapter.courseId,
    lessonExists: true,
    enrollmentStatus: activeEnrollment?.status ?? null,
    hasActiveEnrollment: Boolean(activeEnrollment),
    hasPlaybackId: Boolean(lesson.muxPlaybackId),
    playbackId: lesson.muxPlaybackId,
  });
}

export async function canAccessLessonForCourse(userId: string, courseId: string, lessonId: string) {
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
    return evaluateLessonAccess({ userId, courseId, lessonId, lessonExists: false });
  }

  const activeEnrollment = await getActiveEnrollmentForCourse(userId, courseId);

  return evaluateLessonAccess({
    userId,
    courseId,
    lessonId,
    lessonCourseId: lesson.chapter.courseId,
    lessonExists: true,
    enrollmentStatus: activeEnrollment?.status ?? null,
    hasActiveEnrollment: Boolean(activeEnrollment),
    hasPlaybackId: Boolean(lesson.muxPlaybackId),
    playbackId: lesson.muxPlaybackId,
  });
}

export interface VideoAccessRequest {
  playbackId: string;
  courseId?: string;
  lessonId?: string;
  expiration?: string;
}

export interface AuthorizedPlaybackToken {
  playbackId: string;
  token: string;
  expiresAt: string;
  issuedForUserId: string;
}

export async function getAuthorizedPlaybackToken({
  playbackId,
  courseId,
  lessonId,
  expiration,
}: VideoAccessRequest): Promise<AuthorizedPlaybackToken> {
  const user = await getCurrentUser();

  if (!user?.id) {
    throw new Error("Authentication is required to access protected video content.");
  }

  const normalizedPlaybackId = normalizePlaybackId(playbackId);

  if (lessonId) {
    const authorization = await canAccessLessonForCourse(user.id, courseId || "", lessonId);

    if (!authorization.authorized) {
      throw new Error(authorization.reason);
    }
  }

  const finalExpiration = normalizeMuxPlaybackTokenTtl(expiration);

  const token = await generateMuxPlaybackToken(normalizedPlaybackId, {
    expiration: finalExpiration,
  });

  return {
    playbackId: normalizedPlaybackId,
    token,
    expiresAt: new Date(Date.now() + getMuxPlaybackTokenLifetimeMs(finalExpiration)).toISOString(),
    issuedForUserId: String(user.id),
  };
}
