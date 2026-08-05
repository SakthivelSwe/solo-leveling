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
import android.os.HandlerThread;
import android.os.IBinder;
import android.os.Process;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import java.util.ArrayList;

/**
 * Foreground service that monitors the foreground app every 2 s and brings
 * THE SYSTEM to front when a blacklisted / any non-system app is detected.
 *
 * Performance fix (2026-08): polling was running on Looper.getMainLooper()
 * which blocked the Capacitor WebView render thread every 3 s and caused
 * visible UI jank. It now runs on a dedicated background HandlerThread so the
 * WebView thread is never touched.
 */
public class ScreenTimeService extends Service {

    private static final String CHANNEL_ID    = "SystemPenaltyChannel";
    private static final int    POLL_MS       = 2_000;   // 2 s — off UI thread, safe
    private static final int    QUERY_WINDOW  = 5_000;   // look back 5 s for events

    // Background thread dedicated to usage-stats polling (never the main thread).
    private HandlerThread      bgThread;
    private Handler            bgHandler;
    private Runnable           pollRunnable;

    private ArrayList<String>  blacklistedPackages = new ArrayList<>();
    private boolean            lockdownMode        = false;
    private volatile boolean   running             = false;

    // ── Lifecycle ────────────────────────────────────────────────────────────

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("THE SYSTEM")
                .setContentText("Monitoring active…")
                .setSmallIcon(R.drawable.ic_stat_notify)   // use branded icon, not deprecated system alert
                .setPriority(NotificationCompat.PRIORITY_MIN)
                .build();
        startForeground(202, notification);

        // Create background thread once; reuse across onStartCommand calls.
        bgThread  = new HandlerThread("ScreenTimePoll", Process.THREAD_PRIORITY_BACKGROUND);
        bgThread.start();
        bgHandler = new Handler(bgThread.getLooper());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            if (intent.hasExtra("blacklisted")) {
                blacklistedPackages = intent.getStringArrayListExtra("blacklisted");
                if (blacklistedPackages == null) blacklistedPackages = new ArrayList<>();
            }
            if (intent.hasExtra("lockdownMode")) {
                lockdownMode = intent.getBooleanExtra("lockdownMode", false);
            }
        }
        startMonitoring();
        // START_REDELIVER_INTENT so the last intent is re-delivered if the process
        // is killed by the OS — blacklist / lockdown mode survive restarts.
        return START_REDELIVER_INTENT;
    }

    @Override
    public void onDestroy() {
        stopMonitoring();
        if (bgThread != null) {
            bgThread.quitSafely();
            bgThread = null;
        }
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    // ── Monitoring ──────────────────────────────────────────────────────────

    private void startMonitoring() {
        stopMonitoring();   // cancel any previous schedule
        running = true;

        pollRunnable = new Runnable() {
            @Override
            public void run() {
                if (!running) return;
                checkTopApp();
                bgHandler.postDelayed(this, POLL_MS);
            }
        };
        bgHandler.post(pollRunnable);
    }

    private void stopMonitoring() {
        running = false;
        if (bgHandler != null && pollRunnable != null) {
            bgHandler.removeCallbacks(pollRunnable);
        }
        pollRunnable = null;
    }

    /**
     * Queries recent UsageEvents to find the most recently resumed Activity
     * package. Runs on the background HandlerThread — NEVER on the UI thread.
     */
    private void checkTopApp() {
        try {
            UsageStatsManager usm =
                    (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
            if (usm == null) return;

            long now    = System.currentTimeMillis();
            UsageEvents events = usm.queryEvents(now - QUERY_WINDOW, now);

            String        topPackage = "";
            UsageEvents.Event event  = new UsageEvents.Event();
            while (events.hasNextEvent()) {
                events.getNextEvent(event);
                if (event.getEventType() == UsageEvents.Event.ACTIVITY_RESUMED) {
                    topPackage = event.getPackageName();
                }
            }

            if (topPackage.isEmpty() || topPackage.equals(getPackageName())) return;

            boolean blockApp = false;
            if (lockdownMode) {
                // Block everything except launcher / dialer
                if (!topPackage.contains("launcher") && !topPackage.contains("dialer")) {
                    blockApp = true;
                }
            } else {
                blockApp = blacklistedPackages.contains(topPackage);
            }

            if (blockApp) {
                // Bring THE SYSTEM to front on the MAIN thread (startActivity requires it).
                Intent launchIntent = new Intent(ScreenTimeService.this, MainActivity.class);
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                        | Intent.FLAG_ACTIVITY_CLEAR_TOP
                        | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                launchIntent.putExtra("PENALTY_TRIGGER", true);
                launchIntent.putExtra("DISTRACTING_APP", topPackage);
                // Post the activity start to the main looper (required for startActivity).
                new Handler(android.os.Looper.getMainLooper()).post(
                        () -> startActivity(launchIntent));
            }
        } catch (Exception ignored) {
            // Permissions revoked mid-service — ignore and keep polling.
        }
    }

    // ── Notification channel ────────────────────────────────────────────────

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "System Penalty Monitor",
                    NotificationManager.IMPORTANCE_MIN    // silent, no heads-up
            );
            channel.setShowBadge(false);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }
}
