
package com.aese11.arabiccourseplatform.courses

import com.aese11.arabiccourseplatform.network.ApiClient
import com.aese11.arabiccourseplatform.network.ApiException
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.Request

object CourseDetailsApi {

    private val moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    private val responseAdapter =
        moshi.adapter(CourseDetailsResponse::class.java)

    suspend fun getCourseDetails(
        token: String,
        courseId: String
    ): CourseDetailsResponse = withContext(Dispatchers.IO) {

        val request = Request.Builder()
            .url("${ApiClient.BASE_URL}/api/mobile/courses/$courseId")
            .get()
            .addHeader("Authorization", "Bearer $token")
            .build()

        ApiClient.execute(request).use { response ->

            if (!response.isSuccessful) {
                throw ApiException(
                    statusCode = response.code,
                    message = "Get course details failed: HTTP ${response.code}"
                )
            }

            val body = response.body?.string()
                ?: throw Exception("Empty course details response")

            responseAdapter.fromJson(body)
                ?: throw Exception("Invalid course details response")
        }
    }
}
