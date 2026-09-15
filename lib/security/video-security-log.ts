type VideoSecurityEvent =
  | "token_issued"
  | "access_denied"
  | "invalid_lesson"
  | "rate_limited"
  | "token_generation_failed";

interface VideoSecurityLogInput {
  event: VideoSecurityEvent;
  result: "allowed" | "denied" | "failed";
  userId?: string;
  lessonId?: string;
  courseId?: string;
  errorCategory?: "authentication" | "role" | "enrollment" | "lesson" | "rate_limit" | "playback_configuration" | "token_generation";
}

/** Logs an intentionally allow-listed audit record; never pass request data or tokens here. */
export function logVideoSecurityEvent(input: VideoSecurityLogInput) {
  console.info("[video-security]", {
    timestamp: new Date().toISOString(),
    ...input,
  });
}
