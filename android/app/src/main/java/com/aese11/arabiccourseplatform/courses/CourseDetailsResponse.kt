package com.aese11.arabiccourseplatform.courses

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class CourseDetailsResponse(
    val course: CourseDetails
)

@JsonClass(generateAdapter = true)
data class CourseDetails(
    val id: String,
    val titleAr: String,
    val titleEn: String,
    val slug: String,
    val shortDescriptionAr: String?,
    val shortDescriptionEn: String?,
    val descriptionAr: String?,
    val descriptionEn: String?,
    val featuresAr: String?,
    val featuresEn: String?,
    val outcomesAr: String?,
    val outcomesEn: String?,
    val benefitsAr: String?,
    val benefitsEn: String?,
    val thumbnailUrl: String?,
    val price: String,
    val featured: Boolean,
    val category: CourseCategory?,
    val hasAccess: Boolean,
    val chapters: List<Chapter>
)

@JsonClass(generateAdapter = true)
data class CourseCategory(
    val id: String,
    val nameAr: String,
    val nameEn: String,
    val slug: String
)

@JsonClass(generateAdapter = true)
data class Chapter(
    val id: String,
    val titleAr: String,
    val titleEn: String,
    val order: Int,
    val lessons: List<Lesson>
)

@JsonClass(generateAdapter = true)
data class Lesson(
    val id: String,
    val titleAr: String,
    val titleEn: String,
    val descriptionAr: String?,
    val descriptionEn: String?,
    val order: Int,
    val duration: Int?
)