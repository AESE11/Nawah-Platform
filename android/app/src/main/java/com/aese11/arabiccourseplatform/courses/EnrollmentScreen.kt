package com.aese11.arabiccourseplatform.ui.courses

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.aese11.arabiccourseplatform.auth.AuthApi
import com.aese11.arabiccourseplatform.auth.TokenStorage
import com.aese11.arabiccourseplatform.courses.CoursesApi
import com.aese11.arabiccourseplatform.courses.CourseDetailsApi
import com.aese11.arabiccourseplatform.courses.EnrollmentApi
import com.aese11.arabiccourseplatform.courses.PaymentMethod
import com.aese11.arabiccourseplatform.network.ApiException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext


@Composable
fun EnrollmentScreen(
    courseId: String,
    onBack: () -> Unit,
    onSessionExpired: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var fullName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phoneNumber by remember { mutableStateOf("") }
    var walletNumber by remember { mutableStateOf("") }
    var receiptUri by remember { mutableStateOf<Uri?>(null) }

    var paymentMethods by remember { mutableStateOf<List<PaymentMethod>>(emptyList()) }
    var courseTitle by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(true) }
    var isSubmitting by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var successMessage by remember { mutableStateOf<String?>(null) }

    val receiptPicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        receiptUri = uri
        errorMessage = null
    }

    LaunchedEffect(courseId) {
        isLoading = true
        errorMessage = null

        try {
            val token = TokenStorage.getToken(context)
            if (token.isNullOrBlank()) {
                onSessionExpired()
                return@LaunchedEffect
            }

            val result = withContext(Dispatchers.IO) {
                val user = AuthApi.me(token).user
                val methods = CoursesApi.getPaymentMethods(token)
                val title = try {
                    CourseDetailsApi.getCourseDetails(token, courseId).course.titleAr
                } catch (_: Exception) {
                    ""
                }
                Triple(user, methods, title)
            }

            fullName = result.first.name.orEmpty()
            email = result.first.email
            paymentMethods = result.second.paymentMethods
            courseTitle = result.third.orEmpty().ifBlank { "تفاصيل الدورة غير متاحة" }
        } catch (error: ApiException) {
            if (error.statusCode == 401 || error.statusCode == 403) {
                onSessionExpired()
            } else {
                errorMessage = error.message ?: "تعذر تحميل بيانات الحساب وطرق الدفع."
            }
        } catch (error: Exception) {
            errorMessage = "تعذر تحميل بيانات الحساب أو طرق الدفع. تحقق من اتصالك بالإنترنت."
        } finally {
            isLoading = false
        }
    }

    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 18.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            horizontalAlignment = Alignment.End
        ) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = "طلب الاشتراك في الدورة",
                    modifier = Modifier.fillMaxWidth(),
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary,
                    textAlign = TextAlign.Right
                )
                Text(
                    text = "أكمل بياناتك وأرفق إيصال التحويل لإرسال الطلب.",
                    modifier = Modifier.fillMaxWidth(),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Right
                )
            }

            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                color = MaterialTheme.colorScheme.primaryContainer
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Start
                ) {
                    Icon(
                        imageVector = Icons.Filled.School,
                        contentDescription = null,
                        modifier = Modifier.size(24.dp),
                        tint = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                    Spacer(Modifier.size(10.dp))
                    Column(
                        modifier = Modifier.weight(1f),
                        horizontalAlignment = Alignment.End
                    ) {
                        Text(
                            text = "الدورة المطلوبة",
                            modifier = Modifier.fillMaxWidth(),
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                            textAlign = TextAlign.Right
                        )
                        Text(
                            text = courseTitle.ifBlank { "جارٍ تحميل اسم الدورة..." },
                            modifier = Modifier.fillMaxWidth(),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                            textAlign = TextAlign.Right
                        )
                    }
                }
            }

            if (isLoading) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(22.dp)
                ) {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(28.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                        Text(
                            text = "جارٍ تحميل بيانات الحساب وطرق الدفع...",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            } else {
                errorMessage?.let { message ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer
                        )
                    ) {
                        Text(
                            text = message,
                            modifier = Modifier.padding(16.dp).fillMaxWidth(),
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            textAlign = TextAlign.Right
                        )
                    }
                }

                successMessage?.let { message ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(22.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer
                        )
                    ) {
                        Column(
                            modifier = Modifier.fillMaxWidth().padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Filled.School,
                                contentDescription = null,
                                modifier = Modifier.size(48.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = message,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimaryContainer,
                                textAlign = TextAlign.Center
                            )
                            Button(
                                onClick = onBack,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("العودة إلى الدورة")
                            }
                        }
                    }
                }

                if (successMessage == null) {
                    if (paymentMethods.isEmpty()) {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(20.dp)
                        ) {
                            Text(
                                text = "لا توجد طرق دفع متاحة حاليًا.",
                                modifier = Modifier.fillMaxWidth().padding(20.dp),
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                textAlign = TextAlign.Right
                            )
                        }
                    } else {
                        EnrollmentSectionCard(
                            title = "طريقة الاشتراك في الدورة",
                            subtitle = "اقرأ الخطوات التالية قبل إدخال بيانات الاشتراك."
                        ) {
                            Text(
                                text = "التسجيل اليدوي بعد التحقق من الدفع",
                                modifier = Modifier.fillMaxWidth(),
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface,
                                textAlign = TextAlign.Right
                            )
                            Text(
                                text = "سعر الدورة: 500 جنيه مصري",
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(
                                        MaterialTheme.colorScheme.primaryContainer,
                                        RoundedCornerShape(12.dp)
                                    )
                                    .padding(12.dp),
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimaryContainer,
                                textAlign = TextAlign.Right
                            )
                            Text(
                                text = "1. حوّل قيمة الدورة إلى رقم محفظة اتصالات كاش الموضح في قسم بيانات الدفع أدناه.",
                                modifier = Modifier.fillMaxWidth(),
                                color = MaterialTheme.colorScheme.onSurface,
                                textAlign = TextAlign.Right
                            )
                            Text(
                                text = "2. احتفظ بصورة أو لقطة شاشة واضحة لإيصال التحويل.",
                                modifier = Modifier.fillMaxWidth(),
                                color = MaterialTheme.colorScheme.onSurface,
                                textAlign = TextAlign.Right
                            )
                            Text(
                                text = "3. أرسل الإيصال عبر واتساب إلى رقم المحفظة نفسه.",
                                modifier = Modifier.fillMaxWidth(),
                                color = MaterialTheme.colorScheme.onSurface,
                                textAlign = TextAlign.Right
                            )
                            Text(
                                text = "4. أرفق مع الإيصال: الاسم الرباعي، والبريد الإلكتروني المستخدم في حساب الموقع، ورقم المحفظة التي حوّلت منها، ورقم هاتفك الشخصي، واسم الدورة، وصورة إيصال التحويل.",
                                modifier = Modifier.fillMaxWidth(),
                                color = MaterialTheme.colorScheme.onSurface,
                                textAlign = TextAlign.Right
                            )
                            Text(
                                text = "5. بعد مراجعة الدفع والتحقق منه، سيقوم المسؤول بتفعيل اشتراكك.",
                                modifier = Modifier.fillMaxWidth(),
                                color = MaterialTheme.colorScheme.onSurface,
                                textAlign = TextAlign.Right
                            )

                            // تنبيه نهائي بشأن شروط الاشتراك
                            Surface(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(16.dp),
                                color = MaterialTheme.colorScheme.errorContainer
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(16.dp),
                                    verticalArrangement = Arrangement.spacedBy(10.dp),
                                    horizontalAlignment = Alignment.End
                                ) {
                                    Text(
                                        text = "⚠️ تنبيه مهم: شروط الاشتراك وقبول الطلب",
                                        modifier = Modifier.fillMaxWidth(),
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onErrorContainer,
                                        textAlign = TextAlign.Right
                                    )

                                    Text(
                                        text = "1. الالتزام بخطوات الاشتراك",
                                        modifier = Modifier.fillMaxWidth(),
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onErrorContainer,
                                        textAlign = TextAlign.Right
                                    )

                                    Text(
                                        text = "يجب إتمام جميع خطوات الاشتراك الموضحة أعلاه، وإرسال صورة واضحة لإيصال التحويل وجميع المعلومات المطلوبة عبر واتساب إلى رقم محفظة اتصالات كاش نفسه، وتشمل: الاسم الرباعي، والبريد الإلكتروني المسجل به حسابك على التطبيق، ورقم المحفظة التي تم التحويل منها، ورقم هاتفك الشخصي، واسم الدورة، وصورة إيصال التحويل.",
                                        modifier = Modifier.fillMaxWidth(),
                                        color = MaterialTheme.colorScheme.onErrorContainer,
                                        textAlign = TextAlign.Right
                                    )

                                    Text(
                                        text = "2. البريد الإلكتروني المستخدم",
                                        modifier = Modifier.fillMaxWidth(),
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onErrorContainer,
                                        textAlign = TextAlign.Right
                                    )

                                    Text(
                                        text = "يجب أن يكون البريد الإلكتروني المرسل مع الإيصال هو نفسه البريد الإلكتروني المسجل به حسابك على التطبيق. لا يمكن قبول طلب الاشتراك أو تفعيل الوصول إلى محتوى الدورة باستخدام بريد إلكتروني مختلف، سواء حدث ذلك عن طريق الخطأ أو رغبةً في استخدام بريد آخر.",
                                        modifier = Modifier.fillMaxWidth(),
                                        color = MaterialTheme.colorScheme.onErrorContainer,
                                        textAlign = TextAlign.Right
                                    )

                                    Text(
                                        text = "3. مسؤولية الطالب وقبول الطلب",
                                        modifier = Modifier.fillMaxWidth(),
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onErrorContainer,
                                        textAlign = TextAlign.Right
                                    )

                                    Text(
                                        text = "⚠️ لن يتم قبول طلب الاشتراك أو تفعيل إمكانية مشاهدة محتوى الدورة أو الدورات التي تقدمت للاشتراك بها في حال عدم الالتزام بالتعليمات، أو عدم إرسال الإيصال وجميع المعلومات المطلوبة كاملة، أو تقديم بريد إلكتروني غير مطابق للبريد المسجل بالحساب. ويتحمل الطالب مسؤولية التأكد من صحة بياناته وإتمام الخطوات المطلوبة، ولا تتحمل إدارة التطبيق مسؤولية عدم قبول الطلب أو عدم إتاحة محتوى الدورات الناتج عن عدم الالتزام بهذه التعليمات.",
                                        modifier = Modifier.fillMaxWidth(),
                                        color = MaterialTheme.colorScheme.onErrorContainer,
                                        fontWeight = FontWeight.Medium,
                                        textAlign = TextAlign.Right
                                    )

                                    Text(
                                        text = "4. التواصل مع الإدارة",
                                        modifier = Modifier.fillMaxWidth(),
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onErrorContainer,
                                        textAlign = TextAlign.Right
                                    )

                                    Text(
                                        text = "📞 في حال وجود أي مشكلة أو استفسار أو وقوع خطأ من الأخطاء التي ذكرناها، يُرجى التواصل مع إدارة التطبيق عبر وسائل التواصل الرسمية بالاتصال أو بالمحادثة عبر واتساب على الرقم التالي:",
                                        modifier = Modifier.fillMaxWidth(),
                                        color = MaterialTheme.colorScheme.onErrorContainer,
                                        textAlign = TextAlign.Right
                                    )

                                    Text(
                                        text = "رقم التواصل: 01146890206",
                                        modifier = Modifier.fillMaxWidth(),
                                        fontWeight = FontWeight.Bold,
                                        style = MaterialTheme.typography.titleMedium,
                                        color = MaterialTheme.colorScheme.onErrorContainer,
                                        textAlign = TextAlign.Right
                                    )
                                }
                            }
                        }

                        EnrollmentSectionCard(
                            title = "بيانات الطالب",
                            subtitle = "راجع بياناتك وأكمل الحقول المطلوبة."
                        ) {
                            OutlinedTextField(
                                value = fullName,
                                onValueChange = { fullName = it },
                                label = { Text("الاسم الكامل") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                enabled = !isSubmitting
                            )
                            OutlinedTextField(
                                value = email,
                                onValueChange = {},
                                label = { Text("البريد الإلكتروني للحساب") },
                                modifier = Modifier.fillMaxWidth(),
                                readOnly = true,
                                singleLine = true
                            )
                            OutlinedTextField(
                                value = phoneNumber,
                                onValueChange = { phoneNumber = it },
                                label = { Text("رقم الهاتف") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                enabled = !isSubmitting
                            )
                            OutlinedTextField(
                                value = walletNumber,
                                onValueChange = { walletNumber = it },
                                label = { Text("رقم المحفظة أو الحساب الذي حوّلت منه") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                enabled = !isSubmitting
                            )
                        }

                        val method = paymentMethods.first()
                        EnrollmentSectionCard(
                            title = "بيانات الدفع",
                            subtitle = "استخدم البيانات التالية لإتمام التحويل."
                        ) {
                            Surface(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(16.dp),
                                color = MaterialTheme.colorScheme.primary.copy(alpha = 0.06f)
                            ) {
                                Row(
                                    modifier = Modifier.padding(14.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Filled.AccountBalanceWallet,
                                        contentDescription = "محفظة الدفع",
                                        modifier = Modifier.size(26.dp),
                                        tint = MaterialTheme.colorScheme.primary
                                    )
                                    Spacer(Modifier.size(10.dp))
                                    Text(
                                        text = method.nameAr,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }

                            method.accountDetailsAr
                                ?.takeIf { it.isNotBlank() }
                                ?.let { details ->
                                    Text(
                                        text = "بيانات التحويل",
                                        modifier = Modifier.fillMaxWidth(),
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface,
                                        textAlign = TextAlign.Right
                                    )
                                    Text(
                                        text = details,
                                        modifier = Modifier.fillMaxWidth(),
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        textAlign = TextAlign.Right
                                    )
                                }

                            method.instructionsAr
                                ?.takeIf { it.isNotBlank() }
                                ?.let { instructions ->
                                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                                    Text(
                                        text = "تعليمات الدفع",
                                        modifier = Modifier.fillMaxWidth(),
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface,
                                        textAlign = TextAlign.Right
                                    )
                                    Text(
                                        text = instructions,
                                        modifier = Modifier.fillMaxWidth(),
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        textAlign = TextAlign.Right
                                    )
                                }
                        }

                        EnrollmentSectionCard(
                            title = "إيصال التحويل",
                            subtitle = "ارفع صورة واضحة للإيصال بعد إتمام التحويل."
                        ) {
                            Button(
                                onClick = { receiptPicker.launch("image/*") },
                                enabled = !isSubmitting,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(
                                    imageVector = Icons.Filled.Refresh,
                                    contentDescription = null,
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(Modifier.size(8.dp))
                                Text(
                                    if (receiptUri == null) "اختيار صورة الإيصال"
                                    else "اختيار صورة أخرى"
                                )
                            }

                            if (receiptUri != null) {
                                Surface(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(14.dp),
                                    color = MaterialTheme.colorScheme.primaryContainer
                                ) {
                                    Row(
                                        modifier = Modifier.padding(12.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            imageVector = Icons.Filled.School,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.onPrimaryContainer
                                        )
                                        Spacer(Modifier.size(8.dp))
                                        Text(
                                            text = "تم اختيار صورة الإيصال.",
                                            color = MaterialTheme.colorScheme.onPrimaryContainer
                                        )
                                    }
                                }
                                Text(
                                    text = "الحد الأقصى لحجم الإيصال 2 ميجابايت.",
                                    modifier = Modifier.fillMaxWidth(),
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    textAlign = TextAlign.Right
                                )
                            }
                        }

                        Button(
                            onClick = {
                                errorMessage = null
                                when {
                                    fullName.isBlank() -> errorMessage = "اكتب الاسم الكامل."
                                    phoneNumber.isBlank() -> errorMessage = "اكتب رقم الهاتف."
                                    walletNumber.isBlank() -> errorMessage = "اكتب رقم المحفظة أو الحساب."
                                    receiptUri == null -> errorMessage = "اختر صورة إيصال التحويل."
                                    else -> {
                                        isSubmitting = true
                                        scope.launch {
                                            try {
                                                val token = TokenStorage.getToken(context)
                                                if (token.isNullOrBlank()) {
                                                    onSessionExpired()
                                                    return@launch
                                                }
                                                withContext(Dispatchers.IO) {
                                                    EnrollmentApi.submitRequest(
                                                        contentResolver = context.contentResolver,
                                                        token = token,
                                                        courseId = courseId,
                                                        fullName = fullName,
                                                        email = email,
                                                        transferWalletNumber = walletNumber,
                                                        personalPhoneNumber = phoneNumber,
                                                        receiptUri = receiptUri!!
                                                    )
                                                }
                                                successMessage = "تم إرسال طلب الاشتراك بنجاح. الطلب قيد المراجعة."
                                            } catch (error: ApiException) {
                                                if (error.statusCode == 401 || error.statusCode == 403) {
                                                    onSessionExpired()
                                                } else {
                                                    errorMessage = error.message ?: "فشل إرسال طلب الاشتراك."
                                                }
                                            } catch (error: Exception) {
                                                errorMessage = error.message ?: "حدث خطأ أثناء إرسال الطلب."
                                            } finally {
                                                isSubmitting = false
                                            }
                                        }
                                    }
                                }
                            },
                            enabled = !isSubmitting,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            contentPadding = androidx.compose.foundation.layout.PaddingValues(vertical = 15.dp)
                        ) {
                            if (isSubmitting) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(18.dp),
                                    strokeWidth = 2.dp,
                                    color = MaterialTheme.colorScheme.onPrimary
                                )
                                Spacer(Modifier.size(10.dp))
                                Text("جارٍ إرسال الطلب...")
                            } else {
                                Text("إرسال طلب الاشتراك", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun EnrollmentSectionCard(
    title: String,
    subtitle: String,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            horizontalAlignment = Alignment.End
        ) {
            Text(
                text = title,
                modifier = Modifier.fillMaxWidth(),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                textAlign = TextAlign.Right
            )
            Text(
                text = subtitle,
                modifier = Modifier.fillMaxWidth(),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Right
            )
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            content()
        }
    }
}