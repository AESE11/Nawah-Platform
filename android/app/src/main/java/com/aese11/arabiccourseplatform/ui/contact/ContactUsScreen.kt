package com.aese11.arabiccourseplatform.ui.contact

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp

// Contact details for Nawah platform.
private const val CONTACT_PHONE = "01146890206"
private const val CONTACT_WHATSAPP = "201146890206"
private const val CONTACT_OFFICIAL_EMAIL = "info.nawahplatform@gmail.com"
private const val CONTACT_SUPPORT_EMAIL = "support.nawahplatform@gmail.com"

@Composable
fun ContactUsScreen(
    onBack: () -> Unit
) {
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedButton(
                onClick = onBack,
                shape = RoundedCornerShape(14.dp)
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "رجوع"
                )
                Text("رجوع", modifier = Modifier.padding(start = 6.dp))
            }

            Spacer(modifier = Modifier.weight(1f))

            Text(
                text = "تواصل معنا",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 2.dp
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(76.dp)
                        .background(
                            MaterialTheme.colorScheme.primaryContainer,
                            RoundedCornerShape(22.dp)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    GenericPersonIcon(
                        modifier = Modifier.size(42.dp),
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                Text(
                    text = "نحن هنا لمساعدتك",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
                Text(
                    text = "يمكنك التواصل معنا للاستفسار عن الدورات أو طلب المساعدة الفنية وحل المشكلات.",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center
                )
            }
        }

        ContactMethodCard(
            title = "اتصل بنا",
            description = if (CONTACT_PHONE.isBlank()) "سيتم إضافة رقم الهاتف قريبًا" else CONTACT_PHONE,
            buttonText = "الاتصال الهاتفي",
            enabled = CONTACT_PHONE.isNotBlank(),
            icon = { Icon(Icons.Default.Phone, contentDescription = null, tint = MaterialTheme.colorScheme.primary) },
            onClick = {
                context.startActivity(
                    Intent(Intent.ACTION_DIAL, Uri.parse("tel:$CONTACT_PHONE"))
                )
            }
        )

        ContactMethodCard(
            title = "واتساب",
            description = if (CONTACT_WHATSAPP.isBlank()) "سيتم إضافة رقم واتساب قريبًا" else CONTACT_WHATSAPP,
            buttonText = "التواصل عبر واتساب",
            enabled = CONTACT_WHATSAPP.isNotBlank(),
            icon = { WhatsAppBrandIcon() },
            onClick = {
                val whatsappNumber = CONTACT_WHATSAPP.filter { it.isDigit() }
                context.startActivity(
                    Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/$whatsappNumber"))
                )
            }
        )

        ContactMethodCard(
            title = "الدعم الفني",
            description = CONTACT_SUPPORT_EMAIL,
            buttonText = "التواصل مع الدعم الفني",
            enabled = CONTACT_SUPPORT_EMAIL.isNotBlank(),
            icon = { Icon(Icons.Default.Email, contentDescription = null, tint = MaterialTheme.colorScheme.primary) },
            onClick = {
                context.startActivity(
                    Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:$CONTACT_SUPPORT_EMAIL"))
                )
            }
        )

        ContactMethodCard(
            title = "البريد الإلكتروني الرسمي",
            description = CONTACT_OFFICIAL_EMAIL,
            buttonText = "مراسلة الإدارة",
            enabled = CONTACT_OFFICIAL_EMAIL.isNotBlank(),
            icon = { Icon(Icons.Default.Email, contentDescription = null, tint = MaterialTheme.colorScheme.primary) },
            onClick = {
                context.startActivity(
                    Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:$CONTACT_OFFICIAL_EMAIL"))
                )
            }
        )


        Text(
            text = "نواة — نتمنى لك تجربة تعليمية مميزة",
            modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun ContactMethodCard(
    title: String,
    description: String,
    buttonText: String,
    enabled: Boolean,
    icon: @Composable () -> Unit,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 1.dp
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                // Icon on the left, with the contact text on the right.
                icon()
                Spacer(modifier = Modifier.size(12.dp))
                Column(
                    modifier = Modifier.weight(1f),
                    horizontalAlignment = Alignment.End
                ) {
                    Text(
                        text = title,
                        modifier = Modifier.fillMaxWidth(),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.End
                    )
                    Text(
                        text = description,
                        modifier = Modifier.fillMaxWidth(),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.End
                    )
                }
            }
            Button(
                onClick = onClick,
                enabled = enabled,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors()
            ) {
                Text(buttonText)
            }
        }
    }
}


@Composable
private fun WhatsAppBrandIcon() {
    // Chat bubble and handset in the app's navy/blue palette.
    val navy = MaterialTheme.colorScheme.primary
    Box(
        modifier = Modifier.size(42.dp),
        contentAlignment = Alignment.Center
    ) {
        androidx.compose.foundation.Canvas(modifier = Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height
            val bubble = Path().apply {
                moveTo(w * 0.5f, h * 0.08f)
                cubicTo(w * 0.25f, h * 0.08f, w * 0.08f, h * 0.26f, w * 0.08f, h * 0.49f)
                cubicTo(w * 0.08f, h * 0.63f, w * 0.14f, h * 0.73f, w * 0.24f, h * 0.80f)
                lineTo(w * 0.19f, h * 0.94f)
                lineTo(w * 0.37f, h * 0.86f)
                cubicTo(w * 0.42f, h * 0.88f, w * 0.46f, h * 0.89f, w * 0.51f, h * 0.89f)
                cubicTo(w * 0.75f, h * 0.89f, w * 0.92f, h * 0.71f, w * 0.92f, h * 0.49f)
                cubicTo(w * 0.92f, h * 0.26f, w * 0.74f, h * 0.08f, w * 0.5f, h * 0.08f)
                close()
            }
            drawPath(path = bubble, color = navy)
            val handset = Path().apply {
                moveTo(w * 0.34f, h * 0.29f)
                cubicTo(w * 0.31f, h * 0.30f, w * 0.29f, h * 0.35f, w * 0.31f, h * 0.40f)
                cubicTo(w * 0.36f, h * 0.54f, w * 0.47f, h * 0.65f, w * 0.61f, h * 0.70f)
                cubicTo(w * 0.66f, h * 0.72f, w * 0.71f, h * 0.69f, w * 0.73f, h * 0.65f)
                lineTo(w * 0.66f, h * 0.58f)
                cubicTo(w * 0.64f, h * 0.56f, w * 0.61f, h * 0.57f, w * 0.59f, h * 0.59f)
                lineTo(w * 0.55f, h * 0.62f)
                cubicTo(w * 0.47f, h * 0.58f, w * 0.41f, h * 0.52f, w * 0.38f, h * 0.44f)
                lineTo(w * 0.41f, h * 0.40f)
                cubicTo(w * 0.43f, h * 0.38f, w * 0.43f, h * 0.35f, w * 0.41f, h * 0.33f)
                close()
            }
            drawPath(path = handset, color = androidx.compose.ui.graphics.Color.White)
        }
    }
}

@Composable
private fun GenericPersonIcon(
    modifier: Modifier = Modifier,
    color: androidx.compose.ui.graphics.Color
) {
    androidx.compose.foundation.Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height

        // Head only: no shoulders or body.
        drawCircle(
            color = color,
            radius = w * 0.20f,
            center = androidx.compose.ui.geometry.Offset(w * 0.5f, h * 0.48f),
            style = Stroke(width = w * 0.075f)
        )

        // Headset band curving over the head.
        val headsetBand = Path().apply {
            moveTo(w * 0.25f, h * 0.48f)
            cubicTo(w * 0.22f, h * 0.08f, w * 0.78f, h * 0.08f, w * 0.75f, h * 0.48f)
        }
        drawPath(
            path = headsetBand,
            color = color,
            style = Stroke(width = w * 0.075f, cap = StrokeCap.Round)
        )

        // Two ear cups on the sides of the head.
        drawLine(
            color = color,
            start = androidx.compose.ui.geometry.Offset(w * 0.25f, h * 0.39f),
            end = androidx.compose.ui.geometry.Offset(w * 0.25f, h * 0.59f),
            strokeWidth = w * 0.12f,
            cap = StrokeCap.Round
        )
        drawLine(
            color = color,
            start = androidx.compose.ui.geometry.Offset(w * 0.75f, h * 0.39f),
            end = androidx.compose.ui.geometry.Offset(w * 0.75f, h * 0.59f),
            strokeWidth = w * 0.12f,
            cap = StrokeCap.Round
        )

        // Microphone boom extending from the right ear cup toward the mouth.
        val microphoneArm = Path().apply {
            moveTo(w * 0.75f, h * 0.56f)
            cubicTo(w * 0.75f, h * 0.69f, w * 0.67f, h * 0.72f, w * 0.58f, h * 0.69f)
        }
        drawPath(
            path = microphoneArm,
            color = color,
            style = Stroke(width = w * 0.065f, cap = StrokeCap.Round)
        )
        drawCircle(
            color = color,
            radius = w * 0.055f,
            center = androidx.compose.ui.geometry.Offset(w * 0.56f, h * 0.69f)
        )
    }
}
