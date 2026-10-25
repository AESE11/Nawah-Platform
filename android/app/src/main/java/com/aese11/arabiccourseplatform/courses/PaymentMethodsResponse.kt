package com.aese11.arabiccourseplatform.courses

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class PaymentMethodsResponse(
    val paymentMethods: List<PaymentMethod>
)