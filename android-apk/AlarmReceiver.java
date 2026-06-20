package com.sleepcbti.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class AlarmReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                "sleep_reminder", "睡眠提醒", NotificationManager.IMPORTANCE_DEFAULT);
            channel.setDescription("提醒你按时上床睡觉");
            nm.createNotificationChannel(channel);
        }

        PendingIntent pending = PendingIntent.getActivity(
            context, 0, new Intent(context, MainActivity.class),
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(context, "sleep_reminder");
        } else {
            builder = new Notification.Builder(context);
        }

        Notification notif = builder
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle("睡益良方")
            .setContentText("该准备睡觉了！打开 APP 记录今天的睡眠日记吧。")
            .setPriority(Notification.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .setContentIntent(pending)
            .build();

        nm.notify(1001, notif);
    }

    public static void schedule(Context context, int hour, int minute) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        PendingIntent pending = PendingIntent.getBroadcast(
            context, 0, new Intent(context, AlarmReceiver.class),
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        java.util.Calendar cal = java.util.Calendar.getInstance();
        cal.set(java.util.Calendar.HOUR_OF_DAY, hour);
        cal.set(java.util.Calendar.MINUTE, minute);
        cal.set(java.util.Calendar.SECOND, 0);
        if (cal.before(java.util.Calendar.getInstance())) {
            cal.add(java.util.Calendar.DAY_OF_MONTH, 1);
        }

        am.setRepeating(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(),
            AlarmManager.INTERVAL_DAY, pending);
    }

    public static void cancel(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        PendingIntent pending = PendingIntent.getBroadcast(
            context, 0, new Intent(context, AlarmReceiver.class),
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        am.cancel(pending);
    }
}
