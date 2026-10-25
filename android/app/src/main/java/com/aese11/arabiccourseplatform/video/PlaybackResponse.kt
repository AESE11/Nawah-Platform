package com.aese11.arabiccourseplatform.video

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class PlaybackResponse(
    val lessonId: String,
    val courseId: String,
    val authorized: Boolean,
    val mode: String,
    val streamUrl: String,
    val expires: Long?,
    val watermarkId: String
)