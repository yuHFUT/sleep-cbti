package com.sleepcbti.app;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.webkit.WebViewClient;
import android.webkit.WebResourceResponse;
import android.webkit.WebResourceRequest;
import java.io.InputStream;

public class MainActivity extends Activity {

    private WebView wv;

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        wv = new WebView(this);

        WebSettings ws = wv.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        wv.setWebViewClient(new LocalAssetClient());
        wv.loadUrl("https://localhost/");
        setContentView(wv);
    }

    class LocalAssetClient extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            String path = request.getUrl().getPath();
            if (path == null || path.equals("/")) path = "/index.html";

            try {
                InputStream is = getAssets().open("public" + path);
                String mime = getMime(path);
                WebResourceResponse resp = new WebResourceResponse(mime, "UTF-8", is);
                java.util.Map<String, String> headers = new java.util.HashMap<String, String>();
                headers.put("Access-Control-Allow-Origin", "*");
                resp.setResponseHeaders(headers);
                return resp;
            } catch (Exception e) {
                return null;
            }
        }
    }

    private String getMime(String path) {
        if (path.endsWith(".html")) return "text/html";
        if (path.endsWith(".js")) return "application/javascript";
        if (path.endsWith(".css")) return "text/css";
        if (path.endsWith(".svg")) return "image/svg+xml";
        if (path.endsWith(".png")) return "image/png";
        if (path.endsWith(".json")) return "application/json";
        return "text/plain";
    }
}
