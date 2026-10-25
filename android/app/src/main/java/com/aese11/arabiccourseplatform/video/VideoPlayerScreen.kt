package com.aese11.arabiccourseplatform.ui.video

import androidx.annotation.OptIn
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.media3.common.MediaItem
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import com.aese11.arabiccourseplatform.auth.TokenStorage
import com.aese11.arabiccourseplatform.video.PlaybackApi
import com.aese11.arabiccourseplatform.video.VideoWatermark
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.ui.unit.dp
import com.aese11.arabiccourseplatform.network.ApiException
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.media3.ui.AspectRatioFrameLayout
import android.content.pm.ActivityInfo

@OptIn(UnstableApi::class)
@Composable
fun VideoPlayerScreen(
    lessonId: String,
    onBack: () -> Unit,
    onSessionExpired: () -> Unit
) {

    val context = LocalContext.current

    val activity =
        context as? androidx.activity.ComponentActivity

    var watermarkId by remember {
        mutableStateOf<String?>(null)
    }

    var loading by remember {
        mutableStateOf(true)
    }

    var errorMessage by remember {
        mutableStateOf<String?>(null)
    }

    var isFullscreen by remember {
        mutableStateOf(false)
    }

    val player = remember {
        ExoPlayer.Builder(context).build()
    }

    /*
     * الحصول على Playback URL
     */
    LaunchedEffect(lessonId) {

        val token =
            TokenStorage.getToken(context)

        if (token == null) {

            errorMessage =
                "انتهت جلسة تسجيل الدخول."

            loading = false

            return@LaunchedEffect
        }

        try {

            val playback =
                PlaybackApi.getPlayback(
                    token = token,
                    lessonId = lessonId
                )

            if (!playback.authorized) {

                errorMessage =
                    "غير مصرح لك بتشغيل هذا الدرس."

                loading = false

                return@LaunchedEffect
            }

            watermarkId =
                playback.watermarkId

            val mediaItem =
                MediaItem.fromUri(
                    playback.streamUrl
                )

            player.setMediaItem(mediaItem)

            player.prepare()

            player.playWhenReady = true


        } catch (e: ApiException) {

            if (e.isUnauthorized) {
                onSessionExpired()
            } else {
                errorMessage =
                    e.message ?: "حدث خطأ أثناء تشغيل الفيديو."
            }

        } catch (e: Exception) {

            errorMessage =
                e.message ?: "حدث خطأ أثناء تشغيل الفيديو."

        } finally {
            loading = false
        }

    }

    /*
     * تحرير ExoPlayer عند مغادرة الشاشة
     */
    DisposableEffect(Unit) {


        onDispose {
            player.release()

            if (activity != null) {
                val controller = WindowInsetsControllerCompat(
                    activity.window,
                    activity.window.decorView
                )

                controller.show(
                    WindowInsetsCompat.Type.systemBars()
                )

                WindowCompat.setDecorFitsSystemWindows(
                    activity.window,
                    true
                )

                activity.requestedOrientation =
                    android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
            }
        }

    }

    Box(
        modifier = Modifier.fillMaxSize()
    ) {

        when {

            loading -> {


                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(MaterialTheme.colorScheme.background),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        CircularProgressIndicator(
                            color = MaterialTheme.colorScheme.primary,
                            strokeWidth = 4.dp
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        Text(
                            text = "جاري تجهيز الفيديو...",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                    }
                }

            }

            errorMessage != null -> {


                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(MaterialTheme.colorScheme.background)
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    androidx.compose.material3.Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(20.dp),
                        colors = androidx.compose.material3.CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer
                        )
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "تعذر تشغيل الفيديو",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )

                            Spacer(modifier = Modifier.height(12.dp))

                            Text(
                                text = errorMessage ?: "",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )

                            Spacer(modifier = Modifier.height(16.dp))

                            Button(onClick = onBack) {
                                Text("رجوع")
                            }
                        }
                    }
                }

            }

            else -> {

                AndroidView(
                    factory = { playerContext ->

                        PlayerView(playerContext).apply {
                            this.player = player

                            resizeMode = if (isFullscreen) {
                                AspectRatioFrameLayout.RESIZE_MODE_ZOOM
                            } else {
                                AspectRatioFrameLayout.RESIZE_MODE_FIT
                            }

                            useController = true

                            controllerShowTimeoutMs =
                                3000

                            controllerHideOnTouch =
                                true

                            /*
                             * Fullscreen Button
                             */

                            setFullscreenButtonClickListener {
                                if (activity == null) {
                                    return@setFullscreenButtonClickListener
                                }

                                isFullscreen = !isFullscreen

                                val controller = WindowInsetsControllerCompat(
                                    activity.window,
                                    activity.window.decorView
                                )

                                if (isFullscreen) {
                                    activity.requestedOrientation =
                                        android.content.pm.ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE

                                    WindowCompat.setDecorFitsSystemWindows(
                                        activity.window,
                                        false
                                    )

                                    controller.hide(
                                        WindowInsetsCompat.Type.systemBars()
                                    )

                                    controller.systemBarsBehavior =
                                        WindowInsetsControllerCompat
                                            .BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                                } else {
                                    controller.show(
                                        WindowInsetsCompat.Type.systemBars()
                                    )

                                    WindowCompat.setDecorFitsSystemWindows(
                                        activity.window,
                                        true
                                    )

                                    activity.requestedOrientation =
                                        android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
                                }
                            }

                        }
                    },
                    modifier = Modifier.fillMaxSize()
                )

                /*
                 * Dynamic Watermark
                 */
                watermarkId?.let { id ->

                    VideoWatermark(
                        watermarkId = id,
                        modifier = Modifier.fillMaxSize()
                    )
                }
                Button(
                    onClick = onBack,
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(16.dp),
                    colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary
                    )
                ) {
                    Text(
                        text = "رجوع",
                        color = MaterialTheme.colorScheme.onPrimary,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }
    }
}