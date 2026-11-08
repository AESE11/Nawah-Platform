package com.aese11.arabiccourseplatform.video

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class PlaybackResponse(
    val lessonId: String,
    val courseId: String,
    val authorized: Boolean,
    val provider: String = "VCDN",
    val mode: String? = null,
    val streamUrl: String? = null,
    val youtubeVideoId: String? = null,
    val playerOrigin: String? = null,
    val expires: Long? = null,
    val watermarkId: String
)
