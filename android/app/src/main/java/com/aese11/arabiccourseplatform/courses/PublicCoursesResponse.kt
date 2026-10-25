
package com.aese11.arabiccourseplatform.courses

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class PublicCoursesResponse(
    val courses: List<PublicCourse>
)

@JsonClass(generateAdapter = true)
data class PublicCourse(
    val id: String,
    val titleAr: String,
    val titleEn: String,
    val slug: String,
    val shortDescriptionAr: String?,
    val shortDescriptionEn: String?,
    val price: String,
    val thumbnailUrl: String?,
    val featured: Boolean,
    val category: PublicCourseCategory
)

@JsonClass(generateAdapter = true)
data class PublicCourseCategory(
    val id: String,
    val nameAr: String,
    val nameEn: String,
    val slug: String
)
