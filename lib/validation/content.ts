import { z } from "zod";

export const categorySchema = z.object({
  nameAr: z.string().trim().min(2, "Arabic name is required.").max(120),
  nameEn: z.string().trim().min(2, "English name is required.").max(120),
  descriptionAr: z.string().trim().max(1000).optional().or(z.literal("")),
  descriptionEn: z.string().trim().max(1000).optional().or(z.literal("")),
  slug: z.string().trim().min(2, "Slug is required.").max(120),
});

export const courseSchema = z.object({
  titleAr: z.string().trim().min(2, "Arabic title is required.").max(160),
  titleEn: z.string().trim().min(2, "English title is required.").max(160),
  slug: z.string().trim().min(2, "Slug is required.").max(160),
  shortDescriptionAr: z.string().trim().max(250).optional().or(z.literal("")),
  shortDescriptionEn: z.string().trim().max(250).optional().or(z.literal("")),
  descriptionAr: z.string().trim().max(4000).optional().or(z.literal("")),
  descriptionEn: z.string().trim().max(4000).optional().or(z.literal("")),
  categoryId: z.string().trim().min(1, "Category is required."),
  price: z.coerce.number().min(0, "Price cannot be negative."),
  thumbnailUrl: z.string().trim().url("Thumbnail must be a valid URL.").optional().or(z.literal("")),
  thumbnailPublicId: z.string().trim().max(255).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  featured: z.coerce.boolean().default(false),
});

export const chapterSchema = z.object({
  titleAr: z.string().trim().min(2, "Arabic title is required.").max(160),
  titleEn: z.string().trim().min(2, "English title is required.").max(160),
  descriptionAr: z.string().trim().max(2000).optional().or(z.literal("")),
  descriptionEn: z.string().trim().max(2000).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0),
  courseId: z.string().trim().min(1, "Course is required."),
});

export const lessonSchema = z.object({
  titleAr: z.string().trim().min(2, "Arabic title is required.").max(160),
  titleEn: z.string().trim().min(2, "English title is required.").max(160),
  descriptionAr: z.string().trim().max(2000).optional().or(z.literal("")),
  descriptionEn: z.string().trim().max(2000).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0),
  chapterId: z.string().trim().min(1, "Chapter is required."),
  muxAssetId: z.string().trim().max(255).optional().or(z.literal("")),
  muxPlaybackId: z.string().trim().max(255).optional().or(z.literal("")),
  duration: z.coerce.number().int().min(0).optional().or(z.literal("")),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
export type CourseFormValues = z.infer<typeof courseSchema>;
export type ChapterFormValues = z.infer<typeof chapterSchema>;
export type LessonFormValues = z.infer<typeof lessonSchema>;
