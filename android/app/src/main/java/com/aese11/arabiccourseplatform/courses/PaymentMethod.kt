package com.aese11.arabiccourseplatform.courses

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class PaymentMethod(
    val id: String,
    val nameAr: String,
    val nameEn: String,
    val instructionsAr: String?,
    val instructionsEn: String?,
    val accountDetailsAr: String?,
    val accountDetailsEn: String?,
    val enabled: Boolean,
    val sortOrder: Int
)