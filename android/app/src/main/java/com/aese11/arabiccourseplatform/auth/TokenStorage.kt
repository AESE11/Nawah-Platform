
package com.aese11.arabiccourseplatform.auth

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

object TokenStorage {

    private const val SECURE_PREFS_NAME = "auth_secure_prefs"
    private const val LEGACY_PREFS_NAME = "auth_prefs"
    private const val TOKEN_KEY = "access_token"
    private const val KEY_ALIAS = "arabic_course_token_key"

    private const val ANDROID_KEYSTORE = "AndroidKeyStore"
    private const val TRANSFORMATION = "AES/GCM/NoPadding"
    private const val GCM_TAG_LENGTH_BITS = 128

    private fun securePreferences(context: Context) =
        context.getSharedPreferences(
            SECURE_PREFS_NAME,
            Context.MODE_PRIVATE
        )

    private fun legacyPreferences(context: Context) =
        context.getSharedPreferences(
            LEGACY_PREFS_NAME,
            Context.MODE_PRIVATE
        )

    private fun getOrCreateKey(): SecretKey {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE)
        keyStore.load(null)

        val existingKey = keyStore.getKey(KEY_ALIAS, null) as? SecretKey

        if (existingKey != null) {
            return existingKey
        }

        val keyGenerator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES,
            ANDROID_KEYSTORE
        )

        val keySpec = KeyGenParameterSpec.Builder(
            KEY_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT or
                    KeyProperties.PURPOSE_DECRYPT
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(
                KeyProperties.ENCRYPTION_PADDING_NONE
            )
            .setKeySize(256)
            .build()

        keyGenerator.init(keySpec)
        return keyGenerator.generateKey()
    }

    private fun encryptToken(token: String): String {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey())

        val encryptedBytes = cipher.doFinal(
            token.toByteArray(Charsets.UTF_8)
        )

        val iv = Base64.encodeToString(
            cipher.iv,
            Base64.NO_WRAP
        )

        val ciphertext = Base64.encodeToString(
            encryptedBytes,
            Base64.NO_WRAP
        )

        return "$iv:$ciphertext"
    }

    private fun decryptToken(encryptedToken: String): String {
        val parts = encryptedToken.split(":", limit = 2)

        require(parts.size == 2) {
            "Invalid encrypted token format"
        }

        val iv = Base64.decode(parts[0], Base64.NO_WRAP)
        val ciphertext = Base64.decode(parts[1], Base64.NO_WRAP)

        val cipher = Cipher.getInstance(TRANSFORMATION)

        cipher.init(
            Cipher.DECRYPT_MODE,
            getOrCreateKey(),
            GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv)
        )

        val decryptedBytes = cipher.doFinal(ciphertext)

        return String(decryptedBytes, Charsets.UTF_8)
    }

    @Synchronized
    fun saveToken(
        context: Context,
        token: String
    ) {
        val encryptedToken = encryptToken(token)

        securePreferences(context)
            .edit()
            .putString(TOKEN_KEY, encryptedToken)
            .commit()
            .also { saved ->
                check(saved) {
                    "Unable to save authentication token"
                }
            }

        // Remove any old plaintext token after secure storage succeeds.
        legacyPreferences(context)
            .edit()
            .remove(TOKEN_KEY)
            .apply()
    }

    @Synchronized
    fun getToken(context: Context): String? {
        val encryptedToken = securePreferences(context)
            .getString(TOKEN_KEY, null)

        if (encryptedToken != null) {
            return try {
                decryptToken(encryptedToken)
            } catch (_: Exception) {
                // A missing or invalid key means the user must sign in again.
                clearToken(context)
                null
            }
        }

        // Migrate a token saved by the previous implementation.
        val legacyToken = legacyPreferences(context)
            .getString(TOKEN_KEY, null)
            ?: return null

        return try {
            saveToken(context, legacyToken)
            getTokenFromSecureStorage(context)
        } catch (_: Exception) {
            clearToken(context)
            null
        }
    }

    private fun getTokenFromSecureStorage(context: Context): String? {
        val encryptedToken = securePreferences(context)
            .getString(TOKEN_KEY, null)
            ?: return null

        return decryptToken(encryptedToken)
    }

    @Synchronized
    fun clearToken(context: Context) {
        securePreferences(context)
            .edit()
            .remove(TOKEN_KEY)
            .commit()

        legacyPreferences(context)
            .edit()
            .remove(TOKEN_KEY)
            .commit()
    }
}
