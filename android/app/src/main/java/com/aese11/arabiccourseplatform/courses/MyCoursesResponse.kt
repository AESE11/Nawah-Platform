package com.aese11.arabiccourseplatform.courses

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class MyCoursesResponse(
    val courses: List<CourseEnrollment>
)

@JsonClass(generateAdapter = true)
data class CourseEnrollment(
    val enrollment: Enrollment,
    val course: Course
)

@JsonClass(generateAdapter = true)
data class Enrollment(
    val id: String,
    val status: String,
    val enrolledAt: String?,
    val expiresAt: String?
)

@JsonClass(generateAdapter = true)
data class Course(
    val id: String,
    val titleAr: String,
    val titleEn: String,
    val slug: String,
    val shortDescriptionAr: String?,
    val shortDescriptionEn: String?,
    val thumbnailUrl: String?,
    val price: String,
    val status: String,
    val featured: Boolean
)