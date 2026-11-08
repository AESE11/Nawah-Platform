package com.aese11.arabiccourseplatform.ui.video

import android.content.Context
import android.content.ContextWrapper
import android.util.Log
import android.view.ViewGroup
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.LifecycleOwner
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.PlayerConstants
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.YouTubePlayer
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.listeners.AbstractYouTubePlayerListener
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.options.IFramePlayerOptions
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.views.YouTubePlayerView

private const val TAG = "NawahYouTube"

private fun Context.findLifecycleOwner(): LifecycleOwner? {
    var current = this
    while (current is ContextWrapper) {
        if (current is LifecycleOwner) return current
        current = current.baseContext
    }
    return current as? LifecycleOwner
}

private class SpeedOption(val label: String, val rate: PlayerConstants.PlaybackRate)

private val speedOptions = listOf(
    SpeedOption("0.5x", PlayerConstants.PlaybackRate.RATE_0_5),
    SpeedOption("0.75x", PlayerConstants.PlaybackRate.RATE_0_75),
    SpeedOption("1x", PlayerConstants.PlaybackRate.RATE_1),
    SpeedOption("1.25x", PlayerConstants.PlaybackRate.RATE_1_25),
    SpeedOption("1.5x", PlayerConstants.PlaybackRate.RATE_1_5),
    SpeedOption("1.75x", PlayerConstants.PlaybackRate.RATE_1_75),
    SpeedOption("2x", PlayerConstants.PlaybackRate.RATE_2)
)

private fun fmt(sec: Float): String {
    val t = sec.toInt().coerceAtLeast(0)
    return "%d:%02d".format(t / 60, t % 60)
}

/**
 * مشغل يوتيوب مدمج مع:
 *  - إعدادات تقفل أزرار يوتيوب (controls / fullscreen / rel / annotations)
 *  - طبقة شفافة تبلع كل اللمسات (المستخدم مش بيلمس يوتيوب أبداً)
 *  - غطاء أسود للتحميل / الإيقاف / النهاية / الخطأ
 *  - أزرار تحكم من تصميمك (تشغيل/إيقاف، تقدم، وقت، ملء الشاشة)
 */
@Composable
fun YouTubeEmbeddedPlayer(
    videoId: String,
    pageOrigin: String,
    isFullscreen: Boolean,
    onToggleFullscreen: () -> Unit,
    modifier: Modifier = Modifier
) {
    val safeVideoId = videoId.trim()
    val isValid = safeVideoId.matches(Regex("^[A-Za-z0-9_-]{11}$"))
    val lifecycleOwner = LocalContext.current.findLifecycleOwner()

    key(safeVideoId) {
        var player by remember { mutableStateOf<YouTubePlayer?>(null) }
        var state by remember { mutableStateOf(PlayerConstants.PlayerState.UNSTARTED) }
        var hasStarted by remember { mutableStateOf(false) }
        var hasError by remember { mutableStateOf(false) }
        var current by remember { mutableStateOf(0f) }
        var duration by remember { mutableStateOf(0f) }
        var seeking by remember { mutableStateOf(false) }
        var seekValue by remember { mutableStateOf(0f) }
        var speed by remember { mutableStateOf(speedOptions[2]) } // 1x
        var speedMenu by remember { mutableStateOf(false) }

        val isPlaying = state == PlayerConstants.PlayerState.PLAYING
        val ended = state == PlayerConstants.PlayerState.ENDED

        // رسالة الغطاء (لو null يبقى الفيديو ظاهر)
        val coverText: String? = when {
            !isValid || hasError -> "تعذّر تشغيل الفيديو"
            ended -> "انتهى الفيديو — اضغط لإعادة المشاهدة"
            !hasStarted && state == PlayerConstants.PlayerState.VIDEO_CUED -> "اضغط للتشغيل"
            !hasStarted -> "جاري التحميل…"
            state == PlayerConstants.PlayerState.PAUSED -> "متوقف مؤقتاً — اضغط للمتابعة"
            else -> null
        }

        val onTap: () -> Unit = {
            val p = player
            if (p != null && isValid && !hasError) {
                when {
                    ended -> { p.seekTo(0f); p.play() }
                    isPlaying -> p.pause()
                    else -> p.play()
                }
            }
        }
        val tapState = rememberUpdatedState(onTap)

        Column(
            modifier = modifier.background(Color.Black),
            verticalArrangement = if (isFullscreen) Arrangement.Top else Arrangement.Center
        ) {
            val videoModifier = if (isFullscreen) {
                Modifier.weight(1f).fillMaxWidth()
            } else {
                Modifier.fillMaxWidth().aspectRatio(16f / 9f)
            }

            Box(modifier = videoModifier.background(Color.Black)) {

                if (isValid) {
                    AndroidView(
                        modifier = Modifier.fillMaxSize(),
                        factory = { context ->
                            val playerView = YouTubePlayerView(context).apply {
                                layoutParams = ViewGroup.LayoutParams(
                                    ViewGroup.LayoutParams.MATCH_PARENT,
                                    ViewGroup.LayoutParams.MATCH_PARENT
                                )
                                // لازم false عشان نمرر الإعدادات بتاعتنا
                                enableAutomaticInitialization = false
                            }

                            val listener = object : AbstractYouTubePlayerListener() {
                                override fun onReady(youTubePlayer: YouTubePlayer) {
                                    Log.d(TAG, "ready")
                                    player = youTubePlayer
                                    youTubePlayer.cueVideo(safeVideoId, 0f)
                                }

                                override fun onStateChange(
                                    youTubePlayer: YouTubePlayer,
                                    state2: PlayerConstants.PlayerState
                                ) {
                                    state = state2
                                    if (state2 == PlayerConstants.PlayerState.PLAYING) {
                                        hasStarted = true
                                        // يوتيوب ممكن يرجّع السرعة لـ 1x، فنعيد تطبيق السرعة المختارة
                                        youTubePlayer.setPlaybackRate(speed.rate)
                                    }
                                }

                                override fun onCurrentSecond(youTubePlayer: YouTubePlayer, second: Float) {
                                    current = second
                                }

                                override fun onVideoDuration(youTubePlayer: YouTubePlayer, d: Float) {
                                    duration = d
                                }

                                override fun onError(
                                    youTubePlayer: YouTubePlayer,
                                    error: PlayerConstants.PlayerError
                                ) {
                                    Log.e(TAG, "player error: $error")
                                    hasError = true
                                }
                            }

                            // v13: الـ Builder بياخد context، والـ origin بيتحدد تلقائياً من package التطبيق
                            val options = IFramePlayerOptions.Builder(context)
                                .controls(0)        // نقفل شريط تحكم يوتيوب
                                .fullscreen(0)      // نقفل ملء الشاشة بتاع يوتيوب
                                .rel(0)
                                .ivLoadPolicy(3)    // نقفل الـ annotations
                                .build()

                            playerView.initialize(listener, true, options)
                            lifecycleOwner?.lifecycle?.addObserver(playerView)
                            playerView
                        },
                        onRelease = { view ->
                            lifecycleOwner?.lifecycle?.removeObserver(view)
                            view.release()
                        }
                    )
                }

                // الطبقة الشفافة: تبلع كل اللمسات وتشتغل كـ play/pause
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .pointerInput(Unit) {
                            detectTapGestures(onTap = { tapState.value() })
                        }
                )

                // الغطاء الأسود فوق الفيديو
                if (coverText != null) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color.Black)
                            .pointerInput(Unit) {
                                detectTapGestures(onTap = { tapState.value() })
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(text = coverText, color = Color.White, fontSize = 14.sp)
                    }
                }
            }

            // أزرار التحكم (استبدلها بأيقونات تصميمك لو حابب)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF111111))
                    .padding(horizontal = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                TextButton(onClick = onTap, contentPadding = PaddingValues(horizontal = 8.dp)) {
                    Text(
                        text = if (isPlaying) "إيقاف" else "تشغيل",
                        color = Color.White
                    )
                }

                Slider(
                    value = (if (seeking) seekValue else current).coerceIn(0f, maxOf(duration, 1f)),
                    onValueChange = { seeking = true; seekValue = it },
                    onValueChangeFinished = {
                        player?.seekTo(seekValue)
                        seeking = false
                    },
                    valueRange = 0f..maxOf(duration, 1f),
                    modifier = Modifier.weight(1f)
                )

                Text(
                    text = "${fmt(current)} / ${fmt(duration)}",
                    color = Color.White,
                    fontSize = 12.sp
                )

                Box {
                    TextButton(
                        onClick = { speedMenu = true },
                        contentPadding = PaddingValues(horizontal = 8.dp)
                    ) {
                        Text(text = speed.label, color = Color.White)
                    }
                    DropdownMenu(
                        expanded = speedMenu,
                        onDismissRequest = { speedMenu = false }
                    ) {
                        speedOptions.forEach { opt ->
                            DropdownMenuItem(
                                text = {
                                    Text(if (opt == speed) "${opt.label}  ✓" else opt.label)
                                },
                                onClick = {
                                    speed = opt
                                    speedMenu = false
                                    player?.setPlaybackRate(opt.rate)
                                }
                            )
                        }
                    }
                }

                TextButton(onClick = onToggleFullscreen, contentPadding = PaddingValues(horizontal = 8.dp)) {
                    Text(
                        text = if (isFullscreen) "تصغير" else "ملء الشاشة",
                        color = Color.White
                    )
                }
            }
        }
    }
}
