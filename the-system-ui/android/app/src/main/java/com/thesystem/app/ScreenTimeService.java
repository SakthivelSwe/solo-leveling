package com.thesystem.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import java.util.ArrayList;

public class ScreenTimeService extends Service {
    private static final String CHANNEL_ID = "SystemPenaltyChannel";
    private Handler handler;
    private Runnable runnable;
    private ArrayList<String> blacklistedPackages = new ArrayList<>();

    private boolean lockdownMode = false;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("THE SYSTEM")
                .setContentText("Monitoring for distractions...")
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .build();
        startForeground(202, notification);
        
        handler = new Handler(Looper.getMainLooper());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            if (intent.hasExtra("blacklisted")) {
                blacklistedPackages = intent.getStringArrayListExtra("blacklisted");
            }
            if (intent.hasExtra("lockdownMode")) {
                lockdownMode = intent.getBooleanExtra("lockdownMode", false);
            }
        }
        
        startMonitoring();
        return START_STICKY;
    }

    private void startMonitoring() {
        if (runnable != null) handler.removeCallbacks(runnable);
        
        runnable = new Runnable() {
            @Override
            public void run() {
                checkTopApp();
                handler.postDelayed(this, 3000); // Check every 3 seconds
            }
        };
        handler.post(runnable);
    }

    private void checkTopApp() {
        UsageStatsManager usm = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
        long time = System.currentTimeMillis();
        UsageEvents events = usm.queryEvents(time - 10000, time);
        
        String topPackage = "";
        UsageEvents.Event event = new UsageEvents.Event();
        while (events.hasNextEvent()) {
            events.getNextEvent(event);
            if (event.getEventType() == UsageEvents.Event.ACTIVITY_RESUMED) {
                topPackage = event.getPackageName();
            }
        }
        
        boolean blockApp = false;
        if (!topPackage.isEmpty() && !topPackage.equals(getPackageName())) {
            if (lockdownMode) {
                // In lockdown mode, block everything except the system app (which is getPackageName())
                // Optionally allow phone/messages/launcher
                if (!topPackage.contains("launcher") && !topPackage.contains("dialer")) {
                    blockApp = true;
                }
            } else if (blacklistedPackages.contains(topPackage)) {
                blockApp = true;
            }
        }

        if (blockApp) {
            // Player is distracted! Enforce penalty by bringing the System app to front
            Intent launchIntent = new Intent(ScreenTimeService.this, MainActivity.class);
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            launchIntent.putExtra("PENALTY_TRIGGER", true);
            launchIntent.putExtra("DISTRACTING_APP", topPackage);
            startActivity(launchIntent);
        }
    }

    @Override
    public void onDestroy() {
        if (handler != null && runnable != null) {
            handler.removeCallbacks(runnable);
        }
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null; // Not binding
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "System Penalty Monitor",
                    NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
}
