package com.aese11.arabiccourseplatform.auth

import com.aese11.arabiccourseplatform.network.ApiClient
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

object AuthApi {

    private val moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    private val loginAdapter = moshi.adapter(LoginRequest::class.java)
    private val responseAdapter = moshi.adapter(LoginResponse::class.java)

    suspend fun login(
        email: String,
        password: String
    ): LoginResponse = withContext(Dispatchers.IO) {

        val requestBody = loginAdapter.toJson(
            LoginRequest(
                email = email,
                password = password
            )
        )

        val request = Request.Builder()
            .url("${ApiClient.BASE_URL}/api/mobile/auth/login")
            .post(
                requestBody.toRequestBody(
                    "application/json".toMediaType()
                )
            )
            .build()

        ApiClient.execute(request).use { response ->

            if (!response.isSuccessful) {
                throw Exception("Login failed: HTTP ${response.code}")
            }

            val body = response.body?.string()
                ?: throw Exception("Empty login response")

            responseAdapter.fromJson(body)
                ?: throw Exception("Invalid login response")
        }
    }

    suspend fun register(
        name: String,
        email: String,
        password: String
    ) = withContext(Dispatchers.IO) {

        val requestBody = moshi.adapter(
            Map::class.java
        ).toJson(
            mapOf(
                "name" to name.trim(),
                "email" to email.trim().lowercase(),
                "password" to password
            )
        )

        val request = Request.Builder()
            .url("${ApiClient.BASE_URL}/api/auth/register")
            .post(
                requestBody.toRequestBody(
                    "application/json".toMediaType()
                )
            )
            .build()

        ApiClient.execute(request).use { response ->
            val body = response.body?.string().orEmpty()

            if (!response.isSuccessful) {
                val message = try {
                    val errorData = moshi.adapter(
                        Map::class.java
                    ).fromJson(body)

                    errorData?.get("message")?.toString()
                } catch (_: Exception) {
                    null
                }

                throw Exception(
                    message ?: "Registration failed: HTTP ${response.code}"
                )
            }
        }
    }


    suspend fun changePassword(
        token: String,
        currentPassword: String,
        newPassword: String
    ) = withContext(Dispatchers.IO) {
        val body = moshi.adapter(Map::class.java).toJson(
            mapOf(
                "currentPassword" to currentPassword,
                "newPassword" to newPassword
            )
        )
        val request = Request.Builder()
            .url("${ApiClient.BASE_URL}/api/mobile/auth/change-password")
            .addHeader("Authorization", "Bearer $token")
            .post(body.toRequestBody("application/json".toMediaType()))
            .build()

        ApiClient.execute(request).use { response ->
            val responseBody = response.body?.string().orEmpty()
            if (!response.isSuccessful) {
                val message = try {
                    moshi.adapter(Map::class.java).fromJson(responseBody)
                        ?.get("message")?.toString()
                } catch (_: Exception) {
                    null
                }
                throw Exception(message ?: "تعذر تغيير كلمة المرور (HTTP ${response.code}).")
            }
        }
    }

    suspend fun requestPasswordReset(
        email: String
    ): String = withContext(Dispatchers.IO) {

        val requestBody = moshi.adapter(Map::class.java).toJson(
            mapOf("email" to email.trim().lowercase())
        )

        val request = Request.Builder()
            .url("${ApiClient.BASE_URL}/api/mobile/auth/forgot-password")
            .post(
                requestBody.toRequestBody(
                    "application/json".toMediaType()
                )
            )
            .build()

        ApiClient.execute(request).use { response ->
            val responseBody = response.body?.string().orEmpty()

            val responseData = try {
                moshi.adapter(Map::class.java).fromJson(responseBody)
            } catch (_: Exception) {
                null
            }

            if (!response.isSuccessful) {
                val message = responseData?.get("message")?.toString()
                throw Exception(
                    message ?: "تعذر طلب إعادة تعيين كلمة المرور (HTTP ${response.code})."
                )
            }

            responseData?.get("message")?.toString()
                ?: "إذا كان البريد الإلكتروني مسجلًا لدينا، فستصلك رسالة تتضمن خطوات إعادة تعيين كلمة المرور."
        }
    }


    suspend fun me(token: String): AuthMeResponse = withContext(Dispatchers.IO) {

        val request = Request.Builder()
            .url("${ApiClient.BASE_URL}/api/mobile/auth/me")
            .get()
            .addHeader("Authorization", "Bearer $token")
            .build()

        ApiClient.execute(request).use { response ->

            if (!response.isSuccessful) {
                throw Exception("Auth me failed: HTTP ${response.code}")
            }

            val body = response.body?.string()
                ?: throw Exception("Empty auth me response")

            moshi.adapter(AuthMeResponse::class.java).fromJson(body)
                ?: throw Exception("Invalid auth me response")
        }
    }
}