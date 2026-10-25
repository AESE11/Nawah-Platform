package com.aese11.arabiccourseplatform.network

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response

object ApiClient {

    const val BASE_URL = "http://192.168.100.4:3000"

    private val client = OkHttpClient()

    suspend fun testConnection(): String {
        return withContext(Dispatchers.IO) {

            val request = Request.Builder()
                .url(BASE_URL)
                .build()

            client.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    "Connection Success: ${response.code}"
                } else {
                    "Error: ${response.code}"
                }
            }
        }
    }

    suspend fun execute(request: Request): Response {
        return withContext(Dispatchers.IO) {
            client.newCall(request).execute()
        }
    }
}