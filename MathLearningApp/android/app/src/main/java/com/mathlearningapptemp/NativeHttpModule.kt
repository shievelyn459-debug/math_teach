package com.mathlearningapptemp

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import javax.net.ssl.HttpsURLConnection
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Native HTTP module that bypasses OkHttp
 * Uses Android's HttpURLConnection directly for better compatibility on Chinese devices
 */
class NativeHttpModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "NativeHttp"

    @ReactMethod
    fun get(url: String, promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                Log.d("NativeHttp", "GET request to: $url")
                val startTime = System.currentTimeMillis()

                val connection = URL(url).openConnection() as HttpURLConnection
                connection.requestMethod = "GET"
                connection.connectTimeout = 15000
                connection.readTimeout = 15000
                connection.instanceFollowRedirects = true

                val responseCode = connection.responseCode
                val elapsed = System.currentTimeMillis() - startTime
                Log.d("NativeHttp", "GET response in ${elapsed}ms, status: $responseCode")

                val response = readResponse(connection)

                val result = Arguments.createMap().apply {
                    putInt("status", responseCode)
                    putString("body", response)
                    putInt("elapsed", elapsed.toInt())
                }
                promise.resolve(result)
            } catch (e: Exception) {
                Log.e("NativeHttp", "GET failed: ${e.message}", e)
                promise.reject("HTTP_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun post(url: String, body: String?, contentType: String?, promise: Promise) {
        postWithAuth(url, body, contentType, null, promise)
    }

    @ReactMethod
    fun postWithAuth(url: String, body: String?, contentType: String?, authorization: String?, promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                Log.d("NativeHttp", "POST request to: ${url.substring(0, Math.min(url.length, 80))}...")
                val startTime = System.currentTimeMillis()

                val connection = URL(url).openConnection() as HttpURLConnection
                connection.requestMethod = "POST"
                connection.connectTimeout = 30000
                connection.readTimeout = 30000
                connection.instanceFollowRedirects = true
                if (contentType != null) {
                    connection.setRequestProperty("Content-Type", contentType)
                }
                if (authorization != null) {
                    connection.setRequestProperty("Authorization", authorization)
                }
                connection.doOutput = true

                if (body != null) {
                    val writer = OutputStreamWriter(connection.outputStream, "UTF-8")
                    writer.write(body)
                    writer.flush()
                    writer.close()
                }

                val responseCode = connection.responseCode
                val elapsed = System.currentTimeMillis() - startTime
                Log.d("NativeHttp", "POST response in ${elapsed}ms, status: $responseCode")

                val response = readResponse(connection)

                val result = Arguments.createMap().apply {
                    putInt("status", responseCode)
                    putString("body", response)
                    putInt("elapsed", elapsed.toInt())
                }
                promise.resolve(result)
            } catch (e: Exception) {
                Log.e("NativeHttp", "POST failed: ${e.message}", e)
                promise.reject("HTTP_ERROR", e.message, e)
            }
        }
    }

    private fun readResponse(connection: HttpURLConnection): String {
        val stream = if (connection.responseCode < 400) connection.inputStream else connection.errorStream
        if (stream == null) return ""
        val reader = BufferedReader(InputStreamReader(stream, "UTF-8"))
        val response = StringBuilder()
        var line: String?
        while (reader.readLine().also { line = it } != null) {
            response.append(line)
        }
        reader.close()
        return response.toString()
    }
}
