package com.aese11.arabiccourseplatform.auth

import android.content.Context

class AuthRepository(
    private val context: Context
) {

    suspend fun login(
        email: String,
        password: String
    ): Result<User> {

        return try {

            val response =
                AuthApi.login(
                    email = email,
                    password = password
                )

            TokenStorage.saveToken(
                context = context,
                token = response.token
            )

            Result.success(response.user)

        } catch (e: Exception) {

            Result.failure(e)
        }
    }

    suspend fun register(
        name: String,
        email: String,
        password: String
    ): Result<Unit> {
        return try {
            AuthApi.register(
                name = name,
                email = email,
                password = password
            )

            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }


    fun getToken(): String? {
        return TokenStorage.getToken(context)
    }

    fun logout() {
        TokenStorage.clearToken(context)
    }


    suspend fun requestPasswordReset(email: String): Result<String> {
        return try {
            val message = AuthApi.requestPasswordReset(email)
            Result.success(message)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }


}