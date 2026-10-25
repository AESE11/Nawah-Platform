import { z } from "zod";

export const contentLimits = {
  categoryName: 120,
  categoryDescription: 1000,
  categorySlug: 120,
  courseTitle: 160,
  courseSlug: 160,
  courseShortDescription: 500,
  courseDescription: 10000,
  courseInformation: 5000,
  chapterTitle: 160,
  chapterDescription: 5000,
  lessonTitle: 160,
  lessonDescription: 5000,
  mediaIdentifier: 255,
  thumbnailUrl: 2048,
} as const;

export const categorySchema = z.object({
  nameAr: z.string().trim().min(2, "Arabic name is required.").max(contentLimits.categoryName),
  nameEn: z.string().trim().min(2, "English name is required.").max(contentLimits.categoryName),
  descriptionAr: z.string().trim().max(contentLimits.categoryDescription).optional().or(z.literal("")),
  descriptionEn: z.string().trim().max(contentLimits.categoryDescription).optional().or(z.literal("")),
  slug: z.string().trim().min(2, "Slug is required.").max(contentLimits.categorySlug),
});

export const courseSchema = z.object({
  titleAr: z.string().trim().min(2, "Arabic title is required.").max(contentLimits.courseTitle),
  titleEn: z.string().trim().min(2, "English title is required.").max(contentLimits.courseTitle),
  slug: z.string().trim().min(2, "Slug is required.").max(contentLimits.courseSlug),
  shortDescriptionAr: z.string().trim().max(contentLimits.courseShortDescription).optional().or(z.literal("")),
  shortDescriptionEn: z.string().trim().max(contentLimits.courseShortDescription).optional().or(z.literal("")),
  descriptionAr: z.string().trim().max(contentLimits.courseDescription).optional().or(z.literal("")),
  descriptionEn: z.string().trim().max(contentLimits.courseDescription).optional().or(z.literal("")),
  featuresAr: z.string().trim().max(contentLimits.courseInformation).optional().or(z.literal("")),
  featuresEn: z.string().trim().max(contentLimits.courseInformation).optional().or(z.literal("")),
  outcomesAr: z.string().trim().max(contentLimits.courseInformation).optional().or(z.literal("")),
  outcomesEn: z.string().trim().max(contentLimits.courseInformation).optional().or(z.literal("")),
  benefitsAr: z.string().trim().max(contentLimits.courseInformation).optional().or(z.literal("")),
  benefitsEn: z.string().trim().max(contentLimits.courseInformation).optional().or(z.literal("")),
  categoryId: z.string().trim().min(1, "Category is required."),
  price: z.coerce.number().min(0, "Price cannot be negative."),
  thumbnailUrl: z.string().trim().url("Thumbnail must be a valid URL.").max(contentLimits.thumbnailUrl).optional().or(z.literal("")),
  thumbnailPublicId: z.string().trim().max(contentLimits.mediaIdentifier).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  featured: z.coerce.boolean().default(false),
});

export const chapterSchema = z.object({
  titleAr: z.string().trim().min(2, "Arabic title is required.").max(contentLimits.chapterTitle),
  titleEn: z.string().trim().min(2, "English title is required.").max(contentLimits.chapterTitle),
  descriptionAr: z.string().trim().max(contentLimits.chapterDescription).optional().or(z.literal("")),
  descriptionEn: z.string().trim().max(contentLimits.chapterDescription).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0),
  courseId: z.string().trim().min(1, "Course is required."),
});

export const lessonSchema = z.object({
  titleAr: z.string().trim().min(2, "Arabic title is required.").max(contentLimits.lessonTitle),
  titleEn: z.string().trim().min(2, "English title is required.").max(contentLimits.lessonTitle),
  descriptionAr: z.string().trim().max(contentLimits.lessonDescription).optional().or(z.literal("")),
  descriptionEn: z.string().trim().max(contentLimits.lessonDescription).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0),
  chapterId: z.string().trim().min(1, "Chapter is required."),
  muxAssetId: z.string().trim().max(contentLimits.mediaIdentifier).optional().or(z.literal("")),
  muxPlaybackId: z.string().trim().max(contentLimits.mediaIdentifier).optional().or(z.literal("")),
  vcdnVideoId: z.string().trim().max(contentLimits.mediaIdentifier).optional().or(z.literal("")),
  duration: z.coerce.number().int().min(0).optional().or(z.literal("")),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
export type CourseFormValues = z.infer<typeof courseSchema>;
export type ChapterFormValues = z.infer<typeof chapterSchema>;
export type LessonFormValues = z.infer<typeof lessonSchema>;
