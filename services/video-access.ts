import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getActiveEnrollmentForCourse } from "@/lib/services/enrollment-service";

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
  videoProvider?: "VCDN" | "YOUTUBE" | null;
  youtubeVideoId?: string | null;
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
    hasPlaybackId: lesson.videoProvider === "YOUTUBE"
      ? Boolean(lesson.youtubeVideoId)
      : Boolean(lesson.vcdnVideoId),
    playbackId: lesson.videoProvider === "YOUTUBE"
      ? lesson.youtubeVideoId
      : lesson.vcdnVideoId,
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
    hasPlaybackId: lesson.videoProvider === "YOUTUBE"
      ? Boolean(lesson.youtubeVideoId)
      : Boolean(lesson.vcdnVideoId),
    playbackId: lesson.videoProvider === "YOUTUBE"
      ? lesson.youtubeVideoId
      : lesson.vcdnVideoId,
  });
}
