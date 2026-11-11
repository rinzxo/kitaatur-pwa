package com.rinzgroup.kitaatur;

import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                WebSettings settings = webView.getSettings();
                
                // 1. Modifikasi User-Agent untuk mencegah blokir Google OAuth (Error 403 disallowed_useragent)
                String defaultUa = settings.getUserAgentString();
                String cleanUa = defaultUa.replace("; wv", "").replaceAll("Version\\/[0-9\\.]+\\s?", "");
                settings.setUserAgentString(cleanUa);

                // 2. Aktifkan DOM storage & database untuk sesi Supabase & PKCE
                settings.setJavaScriptEnabled(true);
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);

                // 3. Pastikan popup / tab baru terbuka di WebView yang sama, tidak memicu browser luar
                settings.setSupportMultipleWindows(false);
                settings.setJavaScriptCanOpenWindowsAutomatically(true);

                // 4. Izinkan cookie & third-party cookies untuk OAuth token transfer
                CookieManager cookieManager = CookieManager.getInstance();
                cookieManager.setAcceptCookie(true);
                cookieManager.setAcceptThirdPartyCookies(webView, true);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        try {
            CookieManager.getInstance().flush();
        } catch (Exception ignored) {}
    }

    @Override
    public void onBackPressed() {
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null && webView.canGoBack()) {
                webView.goBack();
                return;
            }
        } catch (Exception ignored) {}
        super.onBackPressed();
    }
}
