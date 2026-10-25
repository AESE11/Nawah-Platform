
package com.aese11.arabiccourseplatform.video

import com.aese11.arabiccourseplatform.network.ApiClient
import com.aese11.arabiccourseplatform.network.ApiException
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.Request

object PlaybackApi {

    private val moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    private val responseAdapter =
        moshi.adapter(PlaybackResponse::class.java)

    suspend fun getPlayback(
        token: String,
        lessonId: String
    ): PlaybackResponse = withContext(Dispatchers.IO) {

        val request = Request.Builder()
            .url("${ApiClient.BASE_URL}/api/mobile/lessons/$lessonId/playback")
            .get()
            .addHeader("Authorization", "Bearer $token")
            .build()

        ApiClient.execute(request).use { response ->

            if (!response.isSuccessful) {
                throw ApiException(
                    statusCode = response.code,
                    message = "Get playback failed: HTTP ${response.code}"
                )
            }

            val body = response.body?.string()
                ?: throw Exception("Empty playback response")

            responseAdapter.fromJson(body)
                ?: throw Exception("Invalid playback response")
        }
    }
}
