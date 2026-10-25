
package com.aese11.arabiccourseplatform.network

class ApiException(
    val statusCode: Int,
    message: String
) : Exception(message) {

    val isUnauthorized: Boolean
        get() = statusCode == 401
}
