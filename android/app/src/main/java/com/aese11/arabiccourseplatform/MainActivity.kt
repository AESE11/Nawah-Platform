
package com.aese11.arabiccourseplatform

import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.Explore
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.aese11.arabiccourseplatform.auth.TokenStorage
import com.aese11.arabiccourseplatform.ui.auth.LoginScreen
import com.aese11.arabiccourseplatform.ui.auth.RegisterScreen
import com.aese11.arabiccourseplatform.ui.courses.CourseDetailsScreen
import com.aese11.arabiccourseplatform.ui.contact.ContactUsScreen
import com.aese11.arabiccourseplatform.ui.courses.EnrollmentRequestsScreen
import com.aese11.arabiccourseplatform.ui.courses.EnrollmentScreen
import com.aese11.arabiccourseplatform.ui.courses.MyCoursesScreen
import com.aese11.arabiccourseplatform.ui.courses.PublicCoursesScreen
import com.aese11.arabiccourseplatform.ui.home.HomeScreen
import com.aese11.arabiccourseplatform.ui.profile.ProfileScreen
import com.aese11.arabiccourseplatform.ui.theme.ArabicCoursePlatformTheme
import com.aese11.arabiccourseplatform.ui.video.VideoPlayerScreen
import com.aese11.arabiccourseplatform.ui.auth.ForgotPasswordScreen


private val MainTabScreens = setOf(
    "home",
    "public_courses",
    "courses",
    "profile"
)

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Preserve screenshot and screen-recording protection.
        window.setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        )

        setContent {
            ArabicCoursePlatformTheme {
                var currentScreen by remember {
                    mutableStateOf(
                        if (TokenStorage.getToken(this) != null) {
                            "home"
                        } else {
                            "login"
                        }
                    )
                }

                var selectedCourseId by remember {
                    mutableStateOf<String?>(null)
                }

                var selectedLessonId by remember {
                    mutableStateOf<String?>(null)
                }

                var courseOrigin by remember {
                    mutableStateOf("public_courses")
                }

                fun logout() {
                    TokenStorage.clearToken(this)
                    selectedCourseId = null
                    selectedLessonId = null
                    currentScreen = "login"
                }

                fun openCourse(courseId: String, origin: String) {
                    selectedCourseId = courseId
                    courseOrigin = origin
                    currentScreen = "course_details"
                }

                fun backFromCourse() {
                    selectedCourseId = null
                    currentScreen = courseOrigin
                }

                BackHandler(
                    enabled = currentScreen != "home" &&
                            currentScreen != "login"
                ) {
                    when (currentScreen) {
                        "video" -> {
                            selectedLessonId = null
                            currentScreen = "course_details"
                        }

                        "enrollment" -> {
                            currentScreen = "course_details"
                        }

                        "course_details" -> {
                            backFromCourse()
                        }

                        "register", "forgot_password" -> {
                            currentScreen = "login"
                        }

                        "enrollment_requests" -> {
                            currentScreen = "courses"
                        }

                        "contact_us" -> {
                            currentScreen = "profile"
                        }

                        "public_courses", "courses", "profile" -> {
                            currentScreen = "home"
                        }

                        else -> {
                            currentScreen = "home"
                        }
                    }
                }

                val showBottomBar = currentScreen in MainTabScreens

                Scaffold(
                    bottomBar = {
                        if (showBottomBar) {
                            MainBottomBar(
                                currentScreen = currentScreen,
                                onNavigate = { destination ->
                                    currentScreen = destination
                                }
                            )
                        }
                    }
                ) { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        when (currentScreen) {
                            "home" -> {
                                HomeScreen(
                                    onExplore = {
                                        currentScreen = "public_courses"
                                    },
                                    onMyCourses = {
                                        currentScreen = "courses"
                                    },
                                    onProfile = {
                                        currentScreen = "profile"
                                    }
                                )
                            }

                            "public_courses" -> {
                                PublicCoursesScreen(
                                    onCourseClick = { courseId ->
                                        openCourse(courseId, "public_courses")
                                    },
                                    onMyCoursesClick = {
                                        currentScreen = "courses"
                                    },
                                    onProfileClick = {
                                        currentScreen = "profile"
                                    },
                                    onLogout = {
                                        logout()
                                    },
                                    onSessionExpired = {
                                        logout()
                                    }
                                )
                            }

                            "login" -> {
                                LoginScreen(
                                    onLoginSuccess = {
                                        currentScreen = "home"
                                    },
                                    onRegisterClick = {
                                        currentScreen = "register"
                                    },
                                    onForgotPasswordClick = {
                                        currentScreen = "forgot_password"
                                    }
                                )
                            }

                            "forgot_password" -> {
                                ForgotPasswordScreen(
                                    onBackToLogin = {
                                        currentScreen = "login"
                                    }
                                )
                            }

                            "register" -> {
                                RegisterScreen(
                                    onRegisterSuccess = {
                                        currentScreen = "login"
                                    },
                                    onLoginClick = {
                                        currentScreen = "login"
                                    }
                                )
                            }

                            "courses" -> {
                                MyCoursesScreen(
                                    onPublicCoursesClick = {
                                        currentScreen = "public_courses"
                                    },
                                    onCourseClick = { courseId ->
                                        openCourse(courseId, "courses")
                                    },
                                    onLogout = {
                                        logout()
                                    },
                                    onSessionExpired = {
                                        logout()
                                    },
                                    onProfileClick = {
                                        currentScreen = "profile"
                                    },
                                    onEnrollmentRequestsClick = {
                                        currentScreen = "enrollment_requests"
                                    }
                                )
                            }

                            "enrollment_requests" -> {
                                EnrollmentRequestsScreen(
                                    onSessionExpired = {
                                        logout()
                                    }
                                )
                            }

                            "enrollment" -> {
                                val courseId = selectedCourseId

                                if (courseId == null) {
                                    currentScreen = "home"
                                } else {
                                    EnrollmentScreen(
                                        courseId = courseId,
                                        onBack = {
                                            currentScreen = "course_details"
                                        },
                                        onSessionExpired = {
                                            logout()
                                        }
                                    )
                                }
                            }

                            "profile" -> {
                                ProfileScreen(
                                    onBack = {
                                        currentScreen = "home"
                                    },
                                    onLogout = {
                                        logout()
                                    },
                                    onContactUsClick = {
                                        currentScreen = "contact_us"
                                    },
                                    onSessionExpired = {
                                        logout()
                                    }
                                )
                            }

                            "contact_us" -> {
                                ContactUsScreen(
                                    onBack = {
                                        currentScreen = "profile"
                                    }
                                )
                            }

                            "course_details" -> {
                                val courseId = selectedCourseId

                                if (courseId != null) {
                                    CourseDetailsScreen(
                                        courseId = courseId,
                                        onLessonClick = { lessonId ->
                                            selectedLessonId = lessonId
                                            currentScreen = "video"
                                        },
                                        onBack = {
                                            backFromCourse()
                                        },
                                        onSessionExpired = {
                                            logout()
                                        },
                                        onEnrollClick = { id ->
                                            selectedCourseId = id
                                            currentScreen = "enrollment"
                                        }
                                    )
                                }
                            }

                            "video" -> {
                                val lessonId = selectedLessonId

                                if (lessonId != null) {
                                    VideoPlayerScreen(
                                        lessonId = lessonId,
                                        onBack = {
                                            selectedLessonId = null
                                            currentScreen = "course_details"
                                        },
                                        onSessionExpired = {
                                            logout()
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MainBottomBar(
    currentScreen: String,
    onNavigate: (String) -> Unit
) {
    val items = listOf(
        Triple("home", "الرئيسية", Icons.Filled.Home),
        Triple("courses", "دوراتي", Icons.Filled.Book),
        Triple("public_courses", "استكشف", Icons.Filled.Explore),
        Triple("profile", "حسابي", Icons.Filled.Person)
    )

    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = 3.dp
    ) {
        items.forEach { (route, label, icon) ->
            NavigationBarItem(
                selected = currentScreen == route,
                onClick = {
                    onNavigate(route)
                },
                icon = {
                    Icon(
                        imageVector = icon,
                        contentDescription = label
                    )
                },
                label = {
                    Text(label)
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = MaterialTheme.colorScheme.primary,
                    selectedTextColor = MaterialTheme.colorScheme.primary,
                    indicatorColor = MaterialTheme.colorScheme.primaryContainer,
                    unselectedIconColor =
                        MaterialTheme.colorScheme.onSurfaceVariant,
                    unselectedTextColor =
                        MaterialTheme.colorScheme.onSurfaceVariant
                )
            )
        }
    }
}
