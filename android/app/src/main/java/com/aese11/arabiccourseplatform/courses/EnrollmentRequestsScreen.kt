
package com.aese11.arabiccourseplatform.ui.courses

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ReceiptLong
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.aese11.arabiccourseplatform.auth.TokenStorage
import com.aese11.arabiccourseplatform.courses.EnrollmentApi
import com.aese11.arabiccourseplatform.courses.EnrollmentRequestItem
import com.aese11.arabiccourseplatform.network.ApiException
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection

private val EnrollmentNavy = Color(0xFF193D68)
private val EnrollmentBackground = Color(0xFFF2F5F9)

@Composable
fun EnrollmentRequestsScreen(
    onSessionExpired: () -> Unit
) {
    val context = LocalContext.current

    var requests by remember {
        mutableStateOf<List<EnrollmentRequestItem>>(emptyList())
    }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var refreshKey by remember { mutableStateOf(0) }

    LaunchedEffect(refreshKey) {
        val token = TokenStorage.getToken(context)

        if (token.isNullOrBlank()) {
            onSessionExpired()
            return@LaunchedEffect
        }

        isLoading = true
        errorMessage = null

        try {
            requests = EnrollmentApi.getMyRequests(token)
        } catch (error: Exception) {
            if ((error as? ApiException)?.statusCode == 401) {
                onSessionExpired()
                return@LaunchedEffect
            }

            errorMessage = "تعذر تحميل طلبات الاشتراك. حاول مرة أخرى."
        } finally {
            isLoading = false
        }
    }

    CompositionLocalProvider(
        LocalLayoutDirection provides LayoutDirection.Rtl
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(EnrollmentBackground)
                .padding(horizontal = 16.dp)
        ) {
            Text(
                text = "طلباتي",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = EnrollmentNavy,
                modifier = Modifier.padding(top = 20.dp, bottom = 16.dp)
            )

            when {
                isLoading -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(color = EnrollmentNavy)
                    }
                }

                errorMessage != null -> {
                    EmptyRequestsState(
                        message = errorMessage!!,
                        buttonText = "إعادة المحاولة",
                        onClick = { refreshKey++ }
                    )
                }

                requests.isEmpty() -> {
                    EmptyRequestsState(
                        message = "لا توجد لديك طلبات اشتراك حتى الآن.",
                        buttonText = "تحديث",
                        onClick = { refreshKey++ }
                    )
                }

                else -> {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "طلبات الاشتراك (${requests.size})",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = EnrollmentNavy
                        )

                        Button(
                            onClick = { refreshKey++ },
                            contentPadding = PaddingValues(
                                horizontal = 12.dp,
                                vertical = 6.dp
                            ),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = EnrollmentNavy
                            )
                        ) {
                            Icon(
                                imageVector = Icons.Default.Refresh,
                                contentDescription = "تحديث",
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(Modifier.size(6.dp))
                            Text("تحديث")
                        }
                    }

                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(bottom = 20.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(
                            items = requests,
                            key = { it.id }
                        ) { request ->
                            EnrollmentRequestCard(request = request)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun EnrollmentRequestCard(
        request: EnrollmentRequestItem
    ) {
        val statusColor = when (request.status.uppercase(Locale.ROOT)) {
            "APPROVED" -> Color(0xFF16804A)
            "REJECTED" -> Color(0xFFC62828)
            else -> Color(0xFFB7791F)
        }

        val statusText = when (request.status.uppercase(Locale.ROOT)) {
            "APPROVED" -> "تم القبول"
            "REJECTED" -> "مرفوض"
            else -> "قيد المراجعة"
        }

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            color = Color.White,
            shadowElevation = 2.dp
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.Top
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ReceiptLong,
                        contentDescription = null,
                        tint = EnrollmentNavy,
                        modifier = Modifier
                            .padding(top = 2.dp, end = 10.dp)
                            .size(28.dp)
                    )

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = request.courseName,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = EnrollmentNavy
                        )

                        Spacer(Modifier.height(4.dp))

                        Text(
                            text = "${request.coursePrice} ${request.currency}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Surface(
                        color = statusColor.copy(alpha = 0.12f),
                        shape = RoundedCornerShape(20.dp)
                    ) {
                        Text(
                            text = statusText,
                            color = statusColor,
                            fontWeight = FontWeight.SemiBold,
                            style = MaterialTheme.typography.labelMedium,
                            modifier = Modifier.padding(
                                horizontal = 10.dp,
                                vertical = 6.dp
                            )
                        )
                    }
                }

                Text(
                    text = "تاريخ الطلب: ${formatRequestDate(request.createdAt)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                request.reviewedAt?.let { reviewedAt ->
                    Text(
                        text = "تاريخ المراجعة: ${formatRequestDate(reviewedAt)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                if (!request.adminNotes.isNullOrBlank()) {
                    Surface(
                        color = EnrollmentBackground,
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp)
                        ) {
                            Text(
                                text = "ملاحظات الإدارة",
                                fontWeight = FontWeight.Bold,
                                color = EnrollmentNavy
                            )

                            Spacer(Modifier.height(4.dp))

                            Text(
                                text = request.adminNotes,
                                color = MaterialTheme.colorScheme.onSurface,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun EmptyRequestsState(
        message: String,
        buttonText: String,
        onClick: () -> Unit
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 48.dp, bottom = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Text(
                text = message,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodyLarge
            )

            Button(
                onClick = onClick,
                colors = ButtonDefaults.buttonColors(
                    containerColor = EnrollmentNavy
                )
            ) {
                Text(buttonText)
            }
        }
    }

    private fun formatRequestDate(value: String): String {
        return try {
            val patterns = listOf(
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                "yyyy-MM-dd'T'HH:mm:ss'Z'",
                "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
                "yyyy-MM-dd'T'HH:mm:ssXXX"
            )

            val date = patterns.firstNotNullOfOrNull { pattern ->
                try {
                    SimpleDateFormat(pattern, Locale.US).apply {
                        timeZone = TimeZone.getTimeZone("UTC")
                    }.parse(value)
                } catch (_: Exception) {
                    null
                }
            } ?: return value

            SimpleDateFormat(
                "dd/MM/yyyy - hh:mm a",
                Locale("ar", "EG")
            ).format(date)
        } catch (_: Exception) {
            value
        }
    }