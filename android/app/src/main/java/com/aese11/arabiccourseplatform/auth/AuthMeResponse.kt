package com.aese11.arabiccourseplatform.auth

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class AuthMeResponse(
    val user: User
)