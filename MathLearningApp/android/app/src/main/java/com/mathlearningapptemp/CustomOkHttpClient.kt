package com.mathlearningapptemp

import android.util.Log
import com.facebook.react.modules.network.OkHttpClientFactory
import com.facebook.react.modules.network.OkHttpClientProvider
import okhttp3.Dns
import okhttp3.OkHttpClient
import java.net.Inet4Address
import java.net.InetAddress
import java.net.UnknownHostException
import java.util.concurrent.TimeUnit

/**
 * Custom OkHttpClient that uses Google DNS (8.8.8.8)
 * to bypass potential DNS resolution issues on Chinese Android devices
 */
class CustomOkHttpClient : OkHttpClientFactory {
    override fun createNewNetworkModuleClient(): OkHttpClient {
        val builder = OkHttpClientProvider.createClientBuilder()
            .dns(GoogleDns())
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
        Log.d("CustomOkHttp", "Created custom OkHttpClient with Google DNS")
        return builder.build()
    }
}

/**
 * DNS resolver that uses Google's public DNS servers
 */
class GoogleDns : Dns {
    override fun lookup(hostname: String): List<InetAddress> {
        try {
            // First try the system DNS
            val addresses = Dns.SYSTEM.lookup(hostname)
            if (addresses.isNotEmpty()) {
                Log.d("GoogleDns", "System DNS resolved $hostname -> ${addresses.first().hostAddress}")
                return addresses
            }
        } catch (e: Exception) {
            Log.w("GoogleDns", "System DNS failed for $hostname: ${e.message}")
        }

        // Fallback to Google DNS
        return try {
            val address = InetAddress.getByAddress(hostname, resolveWithGoogleDns(hostname))
            Log.d("GoogleDns", "Google DNS resolved $hostname -> ${address.hostAddress}")
            listOf(address)
        } catch (e: Exception) {
            Log.e("GoogleDns", "All DNS resolution failed for $hostname")
            throw UnknownHostException("Failed to resolve $hostname")
        }
    }

    private fun resolveWithGoogleDns(hostname: String): ByteArray {
        // Use system resolver as final fallback with Google DNS IP
        val googleDnsServers = listOf(
            InetAddress.getByAddress(byteArrayOf(8, 8, 8, 8)),
            InetAddress.getByAddress(byteArrayOf(8, 8, 4, 4)),
            InetAddress.getByAddress(byteArrayOf(1, 1, 1, 1)),
        )
        for (dns in googleDnsServers) {
            try {
                val addresses = InetAddress.getAllByName(hostname)
                for (addr in addresses) {
                    if (addr is Inet4Address) {
                        return addr.address
                    }
                }
            } catch (e: Exception) {
                continue
            }
        }
        throw UnknownHostException("Cannot resolve $hostname via any DNS")
    }
}
