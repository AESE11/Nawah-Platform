
package com.aese11.arabiccourseplatform.courses

import com.aese11.arabiccourseplatform.network.ApiClient
import com.aese11.arabiccourseplatform.network.ApiException
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.Request

object CoursesApi {

    private val moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    private val responseAdapter =
        moshi.adapter(MyCoursesResponse::class.java)

    private val publicCoursesResponseAdapter =
        moshi.adapter(PublicCoursesResponse::class.java)

    private val paymentMethodsResponseAdapter =
        moshi.adapter(PaymentMethodsResponse::class.java)

    suspend fun getMyCourses(token: String): MyCoursesResponse =
        withContext(Dispatchers.IO) {
            val request = Request.Builder()
                .url("${ApiClient.BASE_URL}/api/mobile/courses/my")
                .get()
                .addHeader("Authorization", "Bearer $token")
                .build()

            ApiClient.execute(request).use { response ->
                if (!response.isSuccessful) {
                    throw ApiException(
                        statusCode = response.code,
                        message = "Get courses failed: HTTP ${response.code}"
                    )
                }

                val body = response.body?.string()
                    ?: throw Exception("Empty courses response")

                responseAdapter.fromJson(body)
                    ?: throw Exception("Invalid courses response")
            }
        }

    suspend fun getPublicCourses(token: String): PublicCoursesResponse =
        withContext(Dispatchers.IO) {
            val request = Request.Builder()
                .url("${ApiClient.BASE_URL}/api/mobile/courses")
                .get()
                .addHeader("Authorization", "Bearer $token")
                .build()

            ApiClient.execute(request).use { response ->
                if (!response.isSuccessful) {
                    throw ApiException(
                        statusCode = response.code,
                        message = "Get public courses failed: HTTP ${response.code}"
                    )
                }

                val body = response.body?.string()
                    ?: throw Exception("Empty public courses response")

                publicCoursesResponseAdapter.fromJson(body)
                    ?: throw Exception("Invalid public courses response")
            }
        }

    suspend fun getPaymentMethods(
        token: String
    ): PaymentMethodsResponse =
        withContext(Dispatchers.IO) {
            val request = Request.Builder()
                .url("${ApiClient.BASE_URL}/api/mobile/payment-methods")
                .get()
                .addHeader("Authorization", "Bearer $token")
                .build()

            ApiClient.execute(request).use { response ->
                if (!response.isSuccessful) {
                    throw ApiException(
                        statusCode = response.code,
                        message = "Get payment methods failed: HTTP ${response.code}"
                    )
                }

                val body = response.body?.string()
                    ?: throw Exception("Empty payment methods response")

                paymentMethodsResponseAdapter.fromJson(body)
                    ?: throw Exception("Invalid payment methods response")
            }
        }
}
