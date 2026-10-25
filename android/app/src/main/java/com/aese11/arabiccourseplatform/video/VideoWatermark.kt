package com.aese11.arabiccourseplatform.video

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlin.random.Random

@Composable
fun VideoWatermark(
    watermarkId: String,
    modifier: Modifier = Modifier
) {
    val positions = remember {
        listOf(
            // 1 — أعلى يسار
            Position(Alignment.TopStart, 0.dp, 0.dp),

            // 2 — أعلى منتصف
            Position(Alignment.TopCenter, 0.dp, 0.dp),

            // 3 — أعلى يمين
            Position(Alignment.TopEnd, 0.dp, 0.dp),

            // 4 — منتصف يسار
            Position(Alignment.CenterStart, 0.dp, 0.dp),

            // 5 — منتصف الشاشة
            Position(Alignment.Center, 0.dp, 0.dp),

            // 6 — منتصف يمين
            Position(Alignment.CenterEnd, 0.dp, 0.dp),

            // 7 — أسفل يسار
            Position(Alignment.BottomStart, 0.dp, 0.dp),

            // 8 — أسفل منتصف
            Position(Alignment.BottomCenter, 0.dp, 0.dp),

            // 9 — أسفل يمين
            Position(Alignment.BottomEnd, 0.dp, 0.dp),

            // 10 — موضع داخلي علوي
            Position(Alignment.TopCenter, 0.dp, 90.dp),

            // 11 — موضع داخلي سفلي
            Position(Alignment.BottomCenter, 0.dp, 90.dp)
        )
    }

    var currentPosition by remember {
        mutableIntStateOf(Random.nextInt(positions.size))
    }

    var visible by remember {
        mutableStateOf(true)
    }

    LaunchedEffect(Unit) {
        while (true) {
            delay(2000)

            var nextPosition = Random.nextInt(positions.size)

            while (nextPosition == currentPosition) {
                nextPosition = Random.nextInt(positions.size)
            }

            visible = false

            delay(300)

            currentPosition = nextPosition
            visible = true
        }
    }

    Box(
        modifier = modifier.fillMaxSize()
    ) {
        val position = positions[currentPosition]

        Box(
            modifier = Modifier
                .align(position.alignment)
                .offset(
                    x = position.offsetX,
                    y = position.offsetY
                )
        ) {
            AnimatedVisibility(
                visible = visible,
                enter = fadeIn(animationSpec = tween(300)),
                exit = fadeOut(animationSpec = tween(300))
            ) {
                Text(
                    text = "ID-$watermarkId",
                    color = Color.White.copy(alpha = 0.75f),
                    fontSize = 11.sp,
                    modifier = Modifier
                        .background(
                            color = Color.Black.copy(alpha = 0.45f),
                            shape = RoundedCornerShape(6.dp)
                        )
                        .padding(
                            horizontal = 8.dp,
                            vertical = 4.dp
                        )
                )
            }
        }
    }
}

private data class Position(
    val alignment: Alignment,
    val offsetX: androidx.compose.ui.unit.Dp,
    val offsetY: androidx.compose.ui.unit.Dp
)