
package com.aese11.arabiccourseplatform.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val AppColorScheme = lightColorScheme(
    primary = BrandNavy,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFDCE8F6),
    onPrimaryContainer = BrandNavy,

    secondary = BrandTeal,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFD9F4ED),
    onSecondaryContainer = Color(0xFF075E57),

    tertiary = BrandBlue,
    onTertiary = Color.White,

    background = AppBackground,
    onBackground = TextPrimary,

    surface = AppSurface,
    onSurface = TextPrimary,
    surfaceVariant = AppSurfaceVariant,
    onSurfaceVariant = TextSecondary,

    outline = Color(0xFFB8C6D8),
    outlineVariant = OutlineSoft,

    error = ErrorRed,
    onError = Color.White,
    errorContainer = Color(0xFFFCE8E8),
    onErrorContainer = Color(0xFF8E202A)
)

@Composable
fun ArabicCoursePlatformTheme(
    darkTheme: Boolean = false,
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = AppColorScheme,
        typography = Typography,
        content = content
    )
}
