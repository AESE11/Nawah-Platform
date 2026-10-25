package com.aese11.arabiccourseplatform.ui.courses

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.VideoLibrary
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.aese11.arabiccourseplatform.auth.TokenStorage
import com.aese11.arabiccourseplatform.courses.Chapter
import com.aese11.arabiccourseplatform.courses.CourseDetails
import com.aese11.arabiccourseplatform.courses.CourseDetailsApi
import com.aese11.arabiccourseplatform.network.ApiException

@Composable
fun CourseDetailsScreen(
    courseId: String,
    onLessonClick: (lessonId: String) -> Unit,
    onBack: () -> Unit,
    onSessionExpired: () -> Unit,
    onEnrollClick: (courseId: String) -> Unit
) {
    val context = LocalContext.current
    var course by remember(courseId) { mutableStateOf<CourseDetails?>(null) }
    var loading by remember(courseId) { mutableStateOf(true) }
    var errorMessage by remember(courseId) { mutableStateOf<String?>(null) }
    var reloadKey by remember(courseId) { mutableStateOf(0) }

    LaunchedEffect(courseId, reloadKey) {
        loading = true
        errorMessage = null
        val token = TokenStorage.getToken(context)
        if (token.isNullOrBlank()) {
            onSessionExpired()
            loading = false
            return@LaunchedEffect
        }
        try {
            course = CourseDetailsApi.getCourseDetails(token = token, courseId = courseId).course
        } catch (e: ApiException) {
            if (e.isUnauthorized) onSessionExpired()
            else errorMessage = e.message ?: "حدث خطأ أثناء تحميل تفاصيل الكورس."
        } catch (e: Exception) {
            errorMessage = e.message ?: "حدث خطأ أثناء تحميل تفاصيل الكورس."
        } finally {
            loading = false
        }
    }

    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        Column(
            Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)
        ) {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = MaterialTheme.colorScheme.primary.copy(alpha = 0.08f)
                ) {
                    Row(
                        Modifier.clickable(onClick = onBack).padding(horizontal = 12.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = null,
                            modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.primary)
                        Text("رجوع", color = MaterialTheme.colorScheme.primary,
                            style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.SemiBold)
                    }
                }
                Spacer(Modifier.width(12.dp))
                Text("تفاصيل الدورة", style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
            }
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

            when {
                loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                        Text("جارٍ تحميل تفاصيل الدورة...",
                            color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
                errorMessage != null -> Box(
                    Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center
                ) {
                    Card(
                        Modifier.fillMaxWidth(), shape = RoundedCornerShape(24.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
                    ) {
                        Column(Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Text("تعذر تحميل الدورة", style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onErrorContainer)
                            Text(errorMessage ?: "", color = MaterialTheme.colorScheme.onErrorContainer,
                                textAlign = TextAlign.Center)
                            Button(onClick = { reloadKey++ }) {
                                Icon(Icons.Filled.Refresh, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(8.dp))
                                Text("إعادة المحاولة")
                            }
                            TextButton(onClick = onBack) { Text("العودة") }
                        }
                    }
                }
                course != null -> {
                    val currentCourse = course!!
                    val expandedChapters = remember(currentCourse.id) { mutableStateMapOf<String, Boolean>() }
                    LazyColumn(
                        Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(18.dp)
                    ) {
                        item {
                            Card(
                                Modifier.fillMaxWidth(), shape = RoundedCornerShape(26.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
                            ) {
                                Column {
                                    Box(
                                        Modifier.fillMaxWidth().height(220.dp)
                                            .background(MaterialTheme.colorScheme.primaryContainer),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        if (!currentCourse.thumbnailUrl.isNullOrBlank()) {
                                            AsyncImage(currentCourse.thumbnailUrl, contentDescription = currentCourse.titleAr,
                                                modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                                        } else {
                                            Icon(Icons.Filled.School, contentDescription = null,
                                                modifier = Modifier.size(56.dp),
                                                tint = MaterialTheme.colorScheme.onPrimaryContainer)
                                        }
                                    }
                                    Column(Modifier.padding(20.dp), horizontalAlignment = Alignment.End,
                                        verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                        Text(currentCourse.titleAr, Modifier.fillMaxWidth(),
                                            style = MaterialTheme.typography.headlineSmall,
                                            fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface,
                                            textAlign = TextAlign.Right)
                                        if (!currentCourse.shortDescriptionAr.isNullOrBlank()) {
                                            Text(currentCourse.shortDescriptionAr, Modifier.fillMaxWidth(),
                                                style = MaterialTheme.typography.bodyMedium,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                                textAlign = TextAlign.Right)
                                        }
                                        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically) {
                                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                                Text("السعر", style = MaterialTheme.typography.labelMedium,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant)
                                                Text("${currentCourse.price} جنيه",
                                                    style = MaterialTheme.typography.titleLarge,
                                                    fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                                            }
                                            Surface(shape = RoundedCornerShape(14.dp),
                                                color = MaterialTheme.colorScheme.primaryContainer) {
                                                Row(Modifier.padding(horizontal = 12.dp, vertical = 9.dp),
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                                                    Icon(Icons.Filled.School, contentDescription = null,
                                                        modifier = Modifier.size(18.dp),
                                                        tint = MaterialTheme.colorScheme.onPrimaryContainer)
                                                    Text("${currentCourse.chapters.size} فصلًا تعليميًا",
                                                        style = MaterialTheme.typography.labelLarge,
                                                        fontWeight = FontWeight.SemiBold,
                                                        color = MaterialTheme.colorScheme.onPrimaryContainer)
                                                }
                                            }
                                        }
                                        if (!currentCourse.hasAccess) {
                                            Button(onClick = { onEnrollClick(currentCourse.id) },
                                                modifier = Modifier.fillMaxWidth(),
                                                shape = RoundedCornerShape(16.dp),
                                                contentPadding = PaddingValues(vertical = 14.dp)) {
                                                Text("اشترك في الدورة", style = MaterialTheme.typography.titleMedium,
                                                    fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if (!currentCourse.descriptionAr.isNullOrBlank()) {
                            item {
                                CourseInfoCard(
                                    title = "عن الدورة",
                                    content = currentCourse.descriptionAr
                                )
                            }
                        }
                        if (!currentCourse.outcomesAr.isNullOrBlank()) {
                            item {
                                CourseInfoCard(
                                    title = "ماذا ستتعلم؟",
                                    content = currentCourse.outcomesAr
                                )
                            }
                        }
                        if (!currentCourse.featuresAr.isNullOrBlank()) {
                            item {
                                CourseInfoCard(
                                    title = "مميزات الدورة",
                                    content = currentCourse.featuresAr
                                )
                            }
                        }
                        if (!currentCourse.benefitsAr.isNullOrBlank()) {
                            item {
                                CourseInfoCard(
                                    title = "فوائد الدورة",
                                    content = currentCourse.benefitsAr
                                )
                            }
                        }
                        item {
                            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.Start) {
                                Surface(shape = RoundedCornerShape(12.dp),
                                    color = MaterialTheme.colorScheme.primary.copy(alpha = 0.08f)) {
                                    Icon(Icons.Filled.VideoLibrary, contentDescription = null,
                                        modifier = Modifier.padding(10.dp).size(22.dp),
                                        tint = MaterialTheme.colorScheme.primary)
                                }
                                Spacer(Modifier.width(10.dp))
                                Column(Modifier.weight(1f), horizontalAlignment = Alignment.End) {
                                    Text("محتوى الدورة", Modifier.fillMaxWidth(),
                                        style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onBackground, textAlign = TextAlign.Right)
                                    Text("اختر الفصل، ثم اضغط على الدرس لبدء المشاهدة.",
                                        Modifier.fillMaxWidth(), style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Right)
                                }
                            }
                        }
                        if (currentCourse.chapters.isEmpty()) {
                            item {
                                Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(20.dp)) {
                                    Text("لا توجد فصول متاحة لهذه الدورة حاليًا.",
                                        Modifier.fillMaxWidth().padding(20.dp),
                                        style = MaterialTheme.typography.bodyLarge,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        textAlign = TextAlign.Right)
                                }
                            }
                        } else {
                            items(currentCourse.chapters, key = { it.id }) { chapter ->
                                ChapterCard(
                                    chapter = chapter,
                                    hasAccess = currentCourse.hasAccess,
                                    expanded = expandedChapters[chapter.id] == true,
                                    onToggle = {
                                        expandedChapters[chapter.id] = expandedChapters[chapter.id] != true
                                    },
                                    onLessonClick = onLessonClick
                                )
                            }
                        }
                    }
                }
                else -> Box(Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        Text("لم يتم العثور على تفاصيل الدورة.")
                        Button(onClick = onBack) { Text("رجوع") }
                    }
                }
            }
        }
    }
}



@Composable
private fun CourseInfoCard(
    title: String,
    content: String
) {
    var expanded by remember(title, content) { mutableStateOf(false) }
    val lines = remember(content) {
        content.lines()
            .map { it.trim().removePrefix("•").removePrefix("-").removePrefix("–").trim() }
            .filter { it.isNotBlank() }
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
            horizontalAlignment = Alignment.End
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .clickable { expanded = !expanded },
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(
                    modifier = Modifier.weight(1f),
                    horizontalAlignment = Alignment.End
                ) {
                    Text(
                        text = title,
                        modifier = Modifier.fillMaxWidth(),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary,
                        textAlign = TextAlign.Right
                    )
                    Text(
                        text = if (expanded) "اضغط لإخفاء التفاصيل" else "اضغط لعرض التفاصيل",
                        modifier = Modifier.fillMaxWidth(),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Right
                    )
                }
                Spacer(Modifier.width(8.dp))
                Icon(
                    imageVector = if (expanded) Icons.Filled.ExpandLess else Icons.Filled.ExpandMore,
                    contentDescription = if (expanded) "إخفاء $title" else "عرض $title",
                    tint = MaterialTheme.colorScheme.primary
                )
            }

            if (expanded) {
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                if (lines.size > 1) {
                    lines.forEach { line ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.Start,
                            verticalAlignment = Alignment.Top
                        ) {
                            Text(
                                text = "•",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Spacer(Modifier.width(8.dp))
                            Text(
                                text = line,
                                modifier = Modifier.weight(1f),
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurface,
                                textAlign = TextAlign.Right
                            )
                        }
                    }
                } else {
                    Text(
                        text = lines.firstOrNull().orEmpty(),
                        modifier = Modifier.fillMaxWidth(),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface,
                        textAlign = TextAlign.Right
                    )
                }
            }
        }
    }
}

@Composable
private fun ChapterCard(
    chapter: Chapter,
    hasAccess: Boolean,
    expanded: Boolean,
    onToggle: () -> Unit,
    onLessonClick: (lessonId: String) -> Unit
) {
    Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(22.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
                Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).clickable(onClick = onToggle),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(Modifier.size(46.dp), shape = RoundedCornerShape(14.dp),
                    color = MaterialTheme.colorScheme.primaryContainer) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(Icons.Filled.School, contentDescription = null,
                            tint = MaterialTheme.colorScheme.onPrimaryContainer)
                    }
                }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f), horizontalAlignment = Alignment.End,
                    verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(chapter.titleAr, Modifier.fillMaxWidth(),
                        style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface, textAlign = TextAlign.Right)
                    Text(
                        text = if (expanded) "إخفاء الدروس" else "${chapter.lessons.size} درس • اضغط للعرض",
                        modifier = Modifier.fillMaxWidth(),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Right
                    )
                }
                Icon(
                    imageVector = if (expanded) Icons.Filled.ExpandLess else Icons.Filled.ExpandMore,
                    contentDescription = if (expanded) "إخفاء الدروس" else "عرض الدروس",
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(start = 6.dp)
                )
            }
            if (expanded) {
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                if (chapter.lessons.isEmpty()) {
                    Text("لا توجد دروس في هذا الفصل حاليًا.", Modifier.fillMaxWidth(),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Right)
                } else {
                    chapter.lessons.forEachIndexed { index, lesson ->
                        Row(
                            Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp))
                                .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f))
                                .then(if (hasAccess) Modifier.clickable { onLessonClick(lesson.id) } else Modifier)
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Surface(Modifier.size(40.dp), shape = RoundedCornerShape(13.dp),
                                color = if (hasAccess) MaterialTheme.colorScheme.primary
                                else MaterialTheme.colorScheme.outlineVariant) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(Icons.Filled.PlayArrow, contentDescription = null,
                                        tint = if (hasAccess) MaterialTheme.colorScheme.onPrimary
                                        else MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f), horizontalAlignment = Alignment.End,
                                verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                Text(lesson.titleAr, Modifier.fillMaxWidth(),
                                    style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurface, textAlign = TextAlign.Right)
                                lesson.duration?.let { duration ->
                                    Text("المدة: ${formatDuration(duration)}", Modifier.fillMaxWidth(),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        textAlign = TextAlign.Right)
                                }
                            }
                            Spacer(Modifier.width(10.dp))
                            Text("${index + 1}", style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
            if (expanded && !hasAccess) {
                Text("اشترك في الدورة لفتح الدروس.", Modifier.fillMaxWidth(),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Right)
            }
        }
    }
}

private fun formatDuration(seconds: Int): String {
    val hours = seconds / 3600
    val minutes = (seconds % 3600) / 60
    val remainingSeconds = seconds % 60
    return when {
        hours > 0 -> "%d:%02d:%02d".format(hours, minutes, remainingSeconds)
        else -> "%d:%02d".format(minutes, remainingSeconds)
    }
}
