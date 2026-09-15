export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface CategoryRecord {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
}

export interface LessonRecord {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  order: number;
  muxAssetId?: string | null;
  muxPlaybackId?: string | null;
  duration?: number | null;
}

export interface ChapterRecord {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  order: number;
  lessons: LessonRecord[];
}

export interface CourseRecord {
  id: string;
  titleAr: string;
  titleEn: string;
  slug: string;
  shortDescriptionAr?: string | null;
  shortDescriptionEn?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  featuresAr?: string | null;
  featuresEn?: string | null;
  outcomesAr?: string | null;
  outcomesEn?: string | null;
  benefitsAr?: string | null;
  benefitsEn?: string | null;
  price: string | number;
  thumbnailUrl?: string | null;
  thumbnailPublicId?: string | null;
  status: CourseStatus;
  featured: boolean;
  categoryId: string;
  category?: CategoryRecord;
  chapters: ChapterRecord[];
}
