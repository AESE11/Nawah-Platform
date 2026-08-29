"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensureAdminAccess } from "@/lib/content";
import { categorySchema, chapterSchema, courseSchema, lessonSchema } from "@/lib/validation/content";

function normalizeText(value: FormDataEntryValue | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function buildSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "item";
}

export async function createCategoryAction(formData: FormData, locale: string) {
  await ensureAdminAccess(locale);

  const payload = {
    nameAr: normalizeText(formData.get("nameAr")),
    nameEn: normalizeText(formData.get("nameEn")),
    descriptionAr: normalizeText(formData.get("descriptionAr")),
    descriptionEn: normalizeText(formData.get("descriptionEn")),
    slug: buildSlug(normalizeText(formData.get("slug")) || normalizeText(formData.get("nameEn"))),
  };

  const parsed = categorySchema.parse(payload);

  const category = await prisma.category.create({
    data: {
      ...parsed,
      descriptionAr: parsed.descriptionAr || null,
      descriptionEn: parsed.descriptionEn || null,
      slug: buildSlug(parsed.slug),
    },
  });

  revalidatePath(`/${locale}/admin/categories`);
  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/courses`);

  return category;
}

export async function updateCategoryAction(formData: FormData, locale: string) {
  await ensureAdminAccess(locale);

  const id = normalizeText(formData.get("categoryId"));
  const payload = {
    nameAr: normalizeText(formData.get("nameAr")),
    nameEn: normalizeText(formData.get("nameEn")),
    descriptionAr: normalizeText(formData.get("descriptionAr")),
    descriptionEn: normalizeText(formData.get("descriptionEn")),
    slug: buildSlug(normalizeText(formData.get("slug")) || normalizeText(formData.get("nameEn"))),
  };

  const parsed = categorySchema.parse({ ...payload, slug: payload.slug });

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...parsed,
      descriptionAr: parsed.descriptionAr || null,
      descriptionEn: parsed.descriptionEn || null,
      slug: buildSlug(parsed.slug),
    },
  });

  revalidatePath(`/${locale}/admin/categories`);
  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/courses`);

  return category;
}

export async function deleteCategoryAction(formData: FormData, locale: string) {
  await ensureAdminAccess(locale);

  const id = normalizeText(formData.get("categoryId"));

  const courses = await prisma.course.count({ where: { categoryId: id } });
  if (courses > 0) {
    throw new Error("This category is in use by one or more courses and cannot be deleted.");
  }

  await prisma.category.delete({ where: { id } });

  revalidatePath(`/${locale}/admin/categories`);
  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/courses`);
}

export async function createCourseAction(formData: FormData, locale: string) {
  await ensureAdminAccess(locale);

  const payload = {
    titleAr: normalizeText(formData.get("titleAr")),
    titleEn: normalizeText(formData.get("titleEn")),
    slug: buildSlug(normalizeText(formData.get("slug")) || normalizeText(formData.get("titleEn"))),
    shortDescriptionAr: normalizeText(formData.get("shortDescriptionAr")),
    shortDescriptionEn: normalizeText(formData.get("shortDescriptionEn")),
    descriptionAr: normalizeText(formData.get("descriptionAr")),
    descriptionEn: normalizeText(formData.get("descriptionEn")),
    categoryId: normalizeText(formData.get("categoryId")),
    price: normalizeText(formData.get("price")),
    thumbnailUrl: normalizeText(formData.get("thumbnailUrl")),
    thumbnailPublicId: normalizeText(formData.get("thumbnailPublicId")),
    status: normalizeText(formData.get("status")) || "DRAFT",
    featured: formData.get("featured") === "on",
  };

  const parsed = courseSchema.parse(payload);

  const course = await prisma.course.create({
    data: {
      ...parsed,
      price: Number(parsed.price),
      thumbnailUrl: parsed.thumbnailUrl || null,
      thumbnailPublicId: parsed.thumbnailPublicId || null,
      shortDescriptionAr: parsed.shortDescriptionAr || null,
      shortDescriptionEn: parsed.shortDescriptionEn || null,
      descriptionAr: parsed.descriptionAr || null,
      descriptionEn: parsed.descriptionEn || null,
      slug: buildSlug(parsed.slug),
      categoryId: parsed.categoryId,
      featured: Boolean(parsed.featured),
    },
  });

  revalidatePath(`/${locale}/admin/courses`);
  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/courses`);

  return course;
}

export async function updateCourseAction(formData: FormData, locale: string) {
  await ensureAdminAccess(locale);

  const id = normalizeText(formData.get("courseId"));

  const payload = {
    titleAr: normalizeText(formData.get("titleAr")),
    titleEn: normalizeText(formData.get("titleEn")),
    slug: buildSlug(normalizeText(formData.get("slug")) || normalizeText(formData.get("titleEn"))),
    shortDescriptionAr: normalizeText(formData.get("shortDescriptionAr")),
    shortDescriptionEn: normalizeText(formData.get("shortDescriptionEn")),
    descriptionAr: normalizeText(formData.get("descriptionAr")),
    descriptionEn: normalizeText(formData.get("descriptionEn")),
    categoryId: normalizeText(formData.get("categoryId")),
    price: normalizeText(formData.get("price")),
    thumbnailUrl: normalizeText(formData.get("thumbnailUrl")),
    thumbnailPublicId: normalizeText(formData.get("thumbnailPublicId")),
    status: normalizeText(formData.get("status")) || "DRAFT",
    featured: formData.get("featured") === "on",
  };

  const parsed = courseSchema.parse(payload);

  const course = await prisma.course.update({
    where: { id },
    data: {
      ...parsed,
      thumbnailUrl: parsed.thumbnailUrl || null,
      thumbnailPublicId: parsed.thumbnailPublicId || null,
      shortDescriptionAr: parsed.shortDescriptionAr || null,
      shortDescriptionEn: parsed.shortDescriptionEn || null,
      descriptionAr: parsed.descriptionAr || null,
      descriptionEn: parsed.descriptionEn || null,
      slug: buildSlug(parsed.slug),
      categoryId: parsed.categoryId,
      price: Number(parsed.price),
      featured: Boolean(parsed.featured),
    },
  });

  revalidatePath(`/${locale}/admin/courses`);
  revalidatePath(`/${locale}/admin/courses/${id}`);
  revalidatePath(`/${locale}/courses`);
  revalidatePath(`/${locale}/courses/${course.slug}`);

  return course;
}

export async function deleteCourseAction(formData: FormData, locale: string) {
  await ensureAdminAccess(locale);

  const id = normalizeText(formData.get("courseId"));

  await prisma.course.delete({ where: { id } });

  revalidatePath(`/${locale}/admin/courses`);
  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/courses`);
}

export async function createChapterAction(formData: FormData, locale: string) {
  await ensureAdminAccess(locale);

  const courseId = normalizeText(formData.get("courseId"));
  const payload = {
    titleAr: normalizeText(formData.get("titleAr")),
    titleEn: normalizeText(formData.get("titleEn")),
    descriptionAr: normalizeText(formData.get("descriptionAr")),
    descriptionEn: normalizeText(formData.get("descriptionEn")),
    order: normalizeText(formData.get("order")) || "0",
    courseId,
  };

  const parsed = chapterSchema.parse(payload);

  const maxOrder = await prisma.chapter.findFirst({
    where: { courseId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const chapter = await prisma.chapter.create({
    data: {
      ...parsed,
      order: Number(parsed.order || (maxOrder?.order ?? 0) + 1),
      descriptionAr: parsed.descriptionAr || null,
      descriptionEn: parsed.descriptionEn || null,
    },
  });

  revalidatePath(`/${locale}/admin/courses/${courseId}`);
  revalidatePath(`/${locale}/courses`);

  return chapter;
}

export async function updateChapterAction(formData: FormData, locale: string) {
  await ensureAdminAccess(locale);

  const id = normalizeText(formData.get("chapterId"));
  const courseId = normalizeText(formData.get("courseId"));
  const payload = {
    titleAr: normalizeText(formData.get("titleAr")),
    titleEn: normalizeText(formData.get("titleEn")),
    descriptionAr: normalizeText(formData.get("descriptionAr")),
    descriptionEn: normalizeText(formData.get("descriptionEn")),
    order: normalizeText(formData.get("order")) || "0",
    courseId,
  };

  const parsed = chapterSchema.parse(payload);

  const chapter = await prisma.chapter.update({
    where: { id },
    data: {
      ...parsed,
      descriptionAr: parsed.descriptionAr || null,
      descriptionEn: parsed.descriptionEn || null,
      order: Number(parsed.order),
    },
  });

  revalidatePath(`/${locale}/admin/courses/${courseId}`);
  revalidatePath(`/${locale}/courses`);

  return chapter;
}

export async function deleteChapterAction(formData: FormData, locale: string) {
  await ensureAdminAccess(locale);

  const chapterId = normalizeText(formData.get("chapterId"));
  const courseId = normalizeText(formData.get("courseId"));

  await prisma.chapter.delete({ where: { id: chapterId } });

  revalidatePath(`/${locale}/admin/courses/${courseId}`);
  revalidatePath(`/${locale}/courses`);
}

export async function moveChapterAction(formData: FormData, locale: string) {
  await ensureAdminAccess(locale);

  const chapterId = normalizeText(formData.get("chapterId"));
  const direction = normalizeText(formData.get("direction"));
  const courseId = normalizeText(formData.get("courseId"));

  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
  if (!chapter) return;

  const chapters = await prisma.chapter.findMany({
    where: { courseId: chapter.courseId },
    orderBy: { order: "asc" },
  });

  const index = chapters.findIndex((item) => item.id === chapterId);
  if (index === -1) return;

  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= chapters.length) return;

  const currentOrder = chapter.order;
  const targetOrder = chapters[nextIndex]!.order;

  await prisma.$transaction([
    prisma.chapter.update({ where: { id: chapterId }, data: { order: targetOrder } }),
    prisma.chapter.update({ where: { id: chapters[nextIndex]!.id }, data: { order: currentOrder } }),
  ]);

  revalidatePath(`/${locale}/admin/courses/${courseId}`);
  revalidatePath(`/${locale}/courses`);
}

export async function createLessonAction(formData: FormData, locale: string) {
  await ensureAdminAccess(locale);

  const chapterId = normalizeText(formData.get("chapterId"));
  const courseId = normalizeText(formData.get("courseId"));
  const payload = {
    titleAr: normalizeText(formData.get("titleAr")),
    titleEn: normalizeText(formData.get("titleEn")),
    descriptionAr: normalizeText(formData.get("descriptionAr")),
    descriptionEn: normalizeText(formData.get("descriptionEn")),
    order: normalizeText(formData.get("order")) || "0",
    chapterId,
    muxAssetId: normalizeText(formData.get("muxAssetId")),
    muxPlaybackId: normalizeText(formData.get("muxPlaybackId")),
    duration: normalizeText(formData.get("duration")) || "0",
  };

  const parsed = lessonSchema.parse(payload);

  const maxOrder = await prisma.lesson.findFirst({
    where: { chapterId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const lesson = await prisma.lesson.create({
    data: {
      ...parsed,
      order: Number(parsed.order || (maxOrder?.order ?? 0) + 1),
      descriptionAr: parsed.descriptionAr || null,
      descriptionEn: parsed.descriptionEn || null,
      muxAssetId: parsed.muxAssetId || null,
      muxPlaybackId: parsed.muxPlaybackId || null,
      duration: parsed.duration ? Number(parsed.duration) : null,
    },
  });

  revalidatePath(`/${locale}/admin/courses/${courseId}`);
  revalidatePath(`/${locale}/courses`);

  return lesson;
}

export async function updateLessonAction(formData: FormData, locale: string) {
  await ensureAdminAccess(locale);

  const id = normalizeText(formData.get("lessonId"));
  const chapterId = normalizeText(formData.get("chapterId"));
  const courseId = normalizeText(formData.get("courseId"));
  const payload = {
    titleAr: normalizeText(formData.get("titleAr")),
    titleEn: normalizeText(formData.get("titleEn")),
    descriptionAr: normalizeText(formData.get("descriptionAr")),
    descriptionEn: normalizeText(formData.get("descriptionEn")),
    order: normalizeText(formData.get("order")) || "0",
    chapterId,
    muxAssetId: normalizeText(formData.get("muxAssetId")),
    muxPlaybackId: normalizeText(formData.get("muxPlaybackId")),
    duration: normalizeText(formData.get("duration")) || "0",
  };

  const parsed = lessonSchema.parse(payload);

  const lesson = await prisma.lesson.update({
    where: { id },
    data: {
      ...parsed,
      descriptionAr: parsed.descriptionAr || null,
      descriptionEn: parsed.descriptionEn || null,
      muxAssetId: parsed.muxAssetId || null,
      muxPlaybackId: parsed.muxPlaybackId || null,
      duration: parsed.duration ? Number(parsed.duration) : null,
      order: Number(parsed.order),
    },
  });

  revalidatePath(`/${locale}/admin/courses/${courseId}`);
  revalidatePath(`/${locale}/courses`);

  return lesson;
}

export async function deleteLessonAction(formData: FormData, locale: string) {
  await ensureAdminAccess(locale);

  const lessonId = normalizeText(formData.get("lessonId"));
  const courseId = normalizeText(formData.get("courseId"));

  await prisma.lesson.delete({ where: { id: lessonId } });

  revalidatePath(`/${locale}/admin/courses/${courseId}`);
  revalidatePath(`/${locale}/courses`);
}

export async function moveLessonAction(formData: FormData, locale: string) {
  await ensureAdminAccess(locale);

  const lessonId = normalizeText(formData.get("lessonId"));
  const direction = normalizeText(formData.get("direction"));
  const courseId = normalizeText(formData.get("courseId"));

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) return;

  const lessons = await prisma.lesson.findMany({
    where: { chapterId: lesson.chapterId },
    orderBy: { order: "asc" },
  });

  const index = lessons.findIndex((item) => item.id === lessonId);
  if (index === -1) return;

  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= lessons.length) return;

  const currentOrder = lesson.order;
  const targetOrder = lessons[nextIndex]!.order;

  await prisma.$transaction([
    prisma.lesson.update({ where: { id: lessonId }, data: { order: targetOrder } }),
    prisma.lesson.update({ where: { id: lessons[nextIndex]!.id }, data: { order: currentOrder } }),
  ]);

  revalidatePath(`/${locale}/admin/courses/${courseId}`);
  revalidatePath(`/${locale}/courses`);
}
