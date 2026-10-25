
package com.aese11.arabiccourseplatform.courses

import android.content.ContentResolver
import android.net.Uri
import android.provider.OpenableColumns
import com.aese11.arabiccourseplatform.network.ApiClient
import com.aese11.arabiccourseplatform.network.ApiException
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

data class EnrollmentRequestsResponse(
    val requests: List<EnrollmentRequestItem>
)

data class EnrollmentRequestItem(
    val id: String,
    val courseId: String,
    val courseName: String,
    val coursePrice: String,
    val currency: String,
    val status: String,
    val adminNotes: String?,
    val createdAt: String,
    val reviewedAt: String?,
    val thumbnailUrl: String?
)

object EnrollmentApi {

    private const val MAX_RECEIPT_SIZE = 2 * 1024 * 1024

    private val moshi = Moshi.Builder()
        .addLast(KotlinJsonAdapterFactory())
        .build()

    private val requestsAdapter =
        moshi.adapter(EnrollmentRequestsResponse::class.java)

    suspend fun getMyRequests(token: String): List<EnrollmentRequestItem> =
        withContext(Dispatchers.IO) {
            val request = Request.Builder()
                .url("${ApiClient.BASE_URL}/api/mobile/enrollment-requests")
                .addHeader("Authorization", "Bearer $token")
                .get()
                .build()

            ApiClient.execute(request).use { response ->
                val responseText = response.body?.string().orEmpty()

                if (!response.isSuccessful) {
                    throw ApiException(
                        statusCode = response.code,
                        message = "Failed to load enrollment requests: HTTP ${response.code}"
                    )
                }

                if (responseText.isBlank()) {
                    throw Exception("Empty enrollment requests response")
                }

                requestsAdapter.fromJson(responseText)?.requests
                    ?: throw Exception("Invalid enrollment requests response")
            }
        }

    suspend fun submitRequest(
        contentResolver: ContentResolver,
        token: String,
        courseId: String,
        fullName: String,
        email: String,
        transferWalletNumber: String,
        personalPhoneNumber: String,
        receiptUri: Uri
    ): String = withContext(Dispatchers.IO) {

        require(fullName.isNotBlank()) {
            "الاسم الكامل مطلوب."
        }
        require(email.isNotBlank()) {
            "البريد الإلكتروني مطلوب."
        }
        require(transferWalletNumber.isNotBlank()) {
            "رقم المحفظة أو الحساب مطلوب."
        }
        require(personalPhoneNumber.isNotBlank()) {
            "رقم الهاتف مطلوب."
        }

        val receiptBytes = contentResolver
            .openInputStream(receiptUri)
            ?.use { it.readBytes() }
            ?: throw Exception("تعذر قراءة صورة الإيصال.")

        require(receiptBytes.isNotEmpty()) {
            "ملف الإيصال فارغ."
        }

        require(receiptBytes.size <= MAX_RECEIPT_SIZE) {
            "حجم الإيصال يجب ألا يتجاوز 2 ميجابايت."
        }

        val mimeType = contentResolver.getType(receiptUri)
            ?: "application/octet-stream"

        val fileName = contentResolver.query(
            receiptUri,
            arrayOf(OpenableColumns.DISPLAY_NAME),
            null,
            null,
            null
        )?.use { cursor ->
            if (cursor.moveToFirst()) {
                val index = cursor.getColumnIndex(
                    OpenableColumns.DISPLAY_NAME
                )
                if (index >= 0) cursor.getString(index) else null
            } else {
                null
            }
        } ?: "receipt"

        val receiptBody = receiptBytes.toRequestBody(
            mimeType.toMediaType()
        )

        val requestBody = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart("courseId", courseId)
            .addFormDataPart("fullName", fullName.trim())
            .addFormDataPart("email", email.trim())
            .addFormDataPart(
                "transferWalletNumber",
                transferWalletNumber.trim()
            )
            .addFormDataPart(
                "personalPhoneNumber",
                personalPhoneNumber.trim()
            )
            .addFormDataPart(
                "receipt",
                fileName,
                receiptBody
            )
            .build()

        val request = Request.Builder()
            .url("${ApiClient.BASE_URL}/api/mobile/enrollment-requests")
            .addHeader("Authorization", "Bearer $token")
            .post(requestBody)
            .build()

        ApiClient.execute(request).use { response ->
            val responseText = response.body?.string().orEmpty()

            if (!response.isSuccessful) {
                throw ApiException(
                    statusCode = response.code,
                    message = "Enrollment request failed: HTTP ${response.code}"
                )
            }

            responseText.ifBlank {
                throw Exception("Empty enrollment response")
            }
        }
    }
}
