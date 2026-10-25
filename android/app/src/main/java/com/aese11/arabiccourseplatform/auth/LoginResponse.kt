package com.aese11.arabiccourseplatform.auth

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class LoginResponse(
    val token: String,
    val user: User
)

@JsonClass(generateAdapter = true)
data class User(
    val id: String,
    val name: String?,
    val email: String,
    val role: String
)