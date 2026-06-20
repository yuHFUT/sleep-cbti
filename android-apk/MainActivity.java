package com.sleepcbti.app;

import android.app.Activity;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    WebView wv;
    @Override protected void onCreate(Bundle s) {
        super.onCreate(s);
        Window w = getWindow();
        w.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        w.setStatusBarColor(0xFF4a6fa5);
        w.setNavigationBarColor(0xFF4a6fa5);
        if (Build.VERSION.SDK_INT >= 26)
            getSystemService(NotificationManager.class).createNotificationChannel(
                new NotificationChannel("sleep","sleep",NotificationManager.IMPORTANCE_DEFAULT));
        wv = new WebView(this);
        wv.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        wv.addJavascriptInterface(new Bridge(this), "NativeBridge");
        wv.setOverScrollMode(View.OVER_SCROLL_ALWAYS);
        wv.setVerticalScrollBarEnabled(false);
        WebSettings ws = wv.getSettings();
        ws.setJavaScriptEnabled(true); ws.setDomStorageEnabled(true);
        ws.setLoadWithOverviewMode(true); ws.setUseWideViewPort(true);
        ws.setBuiltInZoomControls(false); ws.setDisplayZoomControls(false);
        ws.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        wv.setWebViewClient(new WebViewClient());
        wv.loadUrl("http://192.168.31.31:3000");
        setContentView(wv);
    }
    @Override public void onBackPressed() {
        if (wv != null) wv.evaluateJavascript("window.__handleBackPress&&window.__handleBackPress()", null);
    }
}

class Bridge {
    Activity c; Bridge(Activity a) { c = a; }
    @JavascriptInterface public void setNotification(int h, int m) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        PendingIntent pi = PendingIntent.getBroadcast(c, 0,
            new Intent(c, NotifyReceiver.class), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        am.cancel(pi);
        java.util.Calendar cal = java.util.Calendar.getInstance();
        cal.set(java.util.Calendar.HOUR_OF_DAY, h); cal.set(java.util.Calendar.MINUTE, m); cal.set(java.util.Calendar.SECOND, 0);
        if (cal.before(java.util.Calendar.getInstance())) cal.add(java.util.Calendar.DAY_OF_MONTH, 1);
        am.setRepeating(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), AlarmManager.INTERVAL_DAY, pi);
    }
    @JavascriptInterface public void cancelNotification() {
        ((AlarmManager) c.getSystemService(Context.ALARM_SERVICE)).cancel(PendingIntent.getBroadcast(c, 0,
            new Intent(c, NotifyReceiver.class), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
    }
    @JavascriptInterface public void exitApp() { c.finish(); }
}

class NotifyReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context ctx, Intent intent) {
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26)
            nm.createNotificationChannel(new NotificationChannel("sleep","sleep",NotificationManager.IMPORTANCE_DEFAULT));
        PendingIntent pi = PendingIntent.getActivity(ctx, 0,
            new Intent(ctx, MainActivity.class), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        nm.notify(1001, (Build.VERSION.SDK_INT >= 26
            ? new Notification.Builder(ctx, "sleep") : new Notification.Builder(ctx))
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle("Sleep").setContentText("Time for bed")
            .setAutoCancel(true).setContentIntent(pi).build());
    }
}
