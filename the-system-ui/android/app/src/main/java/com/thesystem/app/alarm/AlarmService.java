package com.thesystem.app.alarm;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.text.TextUtils;

import androidx.core.app.NotificationCompat;

import com.thesystem.app.R;

/**
 * Foreground service that actually RINGS the alarm.
 *
 *  - Plays the user's chosen local MP3 (or the system alarm ringtone as a
 *    fallback) at ALARM volume via {@link MediaPlayer} with USAGE_ALARM, so it
 *    is loud, loops, and ignores the ringer/DND the way a real alarm does.
 *  - Vibrates in a repeating pattern.
 *  - Holds a WakeLock and posts a full-screen-intent notification that launches
 *    {@link AlarmActivity} over the lock screen.
 *  - Auto-stops after a safety timeout so a forgotten alarm can't drain the
 *    battery forever.
 */
public class AlarmService extends Service {

    public static final String ACTION_START = "com.thesystem.app.alarm.START";
    public static final String ACTION_DISMISS = "com.thesystem.app.alarm.DISMISS";
    public static final String ACTION_SNOOZE = "com.thesystem.app.alarm.SNOOZE";

    private static final String CHANNEL_ID = "system-ring-v1";
    private static final int NOTIF_ID = 9100;
    private static final long AUTO_STOP_MS = 5 * 60_000L; // 5 minutes safety cap

    /** Lets AlarmActivity know whether it should still show the ringing UI. */
    public static volatile boolean isRinging = false;

    private MediaPlayer mediaPlayer;
    private Vibrator vibrator;
    private PowerManager.WakeLock wakeLock;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable autoStop = this::stopEverything;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : ACTION_START;
        if (ACTION_DISMISS.equals(action)) {
            stopEverything();
            return START_NOT_STICKY;
        }
        if (ACTION_SNOOZE.equals(action)) {
            int minutes = new AlarmPrefs(this).getSnoozeMinutes();
            AlarmScheduler.scheduleSnooze(this, minutes);
            stopEverything();
            return START_NOT_STICKY;
        }
        startRinging();
        return START_STICKY;
    }

    private void startRinging() {
        AlarmPrefs prefs = new AlarmPrefs(this);
        startForegroundNotification(prefs.getLabel());
        acquireWakeLock();
        startSound(prefs.getSoundUri());
        if (prefs.isVibrate()) startVibration();

        isRinging = true;
        launchFullScreen();

        handler.removeCallbacks(autoStop);
        handler.postDelayed(autoStop, AUTO_STOP_MS);
    }

    private void startForegroundNotification(String label) {
        createChannel();

        PendingIntent fullScreen = PendingIntent.getActivity(
                this, 0, new Intent(this, AlarmActivity.class)
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        PendingIntent dismiss = PendingIntent.getService(
                this, 1, new Intent(this, AlarmService.class).setAction(ACTION_DISMISS),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        PendingIntent snooze = PendingIntent.getService(
                this, 2, new Intent(this, AlarmService.class).setAction(ACTION_SNOOZE),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_notify)
                .setContentTitle("\u26A1 " + (TextUtils.isEmpty(label) ? "ALARM" : label))
                .setContentText("Hunter, your alarm is ringing. Arise.")
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setOngoing(true)
                .setAutoCancel(false)
                .setSilent(true) // MediaPlayer handles the sound; keep the notification itself silent
                .setFullScreenIntent(fullScreen, true)
                .setContentIntent(fullScreen)
                .addAction(0, "SNOOZE", snooze)
                .addAction(0, "DISMISS", dismiss)
                .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIF_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIF_ID, notification);
        }
    }

    private void createChannel() {
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm == null) return;
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID, "\u26A1 THE SYSTEM \u2014 Ringing Alarm", NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("The full-screen alarm while it is ringing");
        channel.setSound(null, null);          // service plays the sound itself
        channel.enableVibration(false);        // service handles vibration
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        channel.setBypassDnd(true);
        nm.createNotificationChannel(channel);
    }

    private void startSound(String soundUri) {
        try {
            // Force the device's ALARM stream to an audible level so a silenced
            // ringer/media volume can't mute the alarm.
            AudioManager audio = getSystemService(AudioManager.class);
            if (audio != null) {
                int max = audio.getStreamMaxVolume(AudioManager.STREAM_ALARM);
                int target = Math.max(1, (int) Math.round(max * 0.85));
                if (audio.getStreamVolume(AudioManager.STREAM_ALARM) < target) {
                    audio.setStreamVolume(AudioManager.STREAM_ALARM, target, 0);
                }
            }

            Uri uri = null;
            if (!TextUtils.isEmpty(soundUri)) {
                try { uri = Uri.parse(soundUri); } catch (Exception ignored) { uri = null; }
            }
            if (uri == null) {
                uri = RingtoneManager.getActualDefaultRingtoneUri(this, RingtoneManager.TYPE_ALARM);
            }
            if (uri == null) {
                uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            }

            mediaPlayer = new MediaPlayer();
            mediaPlayer.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build());
            mediaPlayer.setDataSource(this, uri);
            mediaPlayer.setLooping(true);
            mediaPlayer.setOnErrorListener((mp, what, extra) -> true);
            mediaPlayer.prepare();
            mediaPlayer.start();
        } catch (Exception e) {
            // Last-ditch fallback: default alarm ringtone.
            try {
                releaseMediaPlayer();
                Uri fallback = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                mediaPlayer = new MediaPlayer();
                mediaPlayer.setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build());
                mediaPlayer.setDataSource(this, fallback);
                mediaPlayer.setLooping(true);
                mediaPlayer.prepare();
                mediaPlayer.start();
            } catch (Exception ignored) { /* give up on sound; vibration still fires */ }
        }
    }

    private void startVibration() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                VibratorManager vm = (VibratorManager) getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                vibrator = vm != null ? vm.getDefaultVibrator() : null;
            } else {
                vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            }
            if (vibrator == null || !vibrator.hasVibrator()) return;
            long[] pattern = {0, 700, 500, 700, 800};
            AudioAttributes attrs = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .build();
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0), attrs);
        } catch (Exception ignored) {}
    }

    private void acquireWakeLock() {
        try {
            PowerManager pm = getSystemService(PowerManager.class);
            if (pm == null) return;
            wakeLock = pm.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK, "thesystem:alarm");
            wakeLock.setReferenceCounted(false);
            wakeLock.acquire(AUTO_STOP_MS + 10_000L);
        } catch (Exception ignored) {}
    }

    private void launchFullScreen() {
        try {
            startActivity(new Intent(this, AlarmActivity.class)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK));
        } catch (Exception ignored) {}
    }

    private void stopEverything() {
        isRinging = false;
        handler.removeCallbacks(autoStop);
        releaseMediaPlayer();
        if (vibrator != null) {
            try { vibrator.cancel(); } catch (Exception ignored) {}
            vibrator = null;
        }
        if (wakeLock != null && wakeLock.isHeld()) {
            try { wakeLock.release(); } catch (Exception ignored) {}
        }
        wakeLock = null;
        stopForeground(STOP_FOREGROUND_REMOVE);
        stopSelf();
    }

    private void releaseMediaPlayer() {
        if (mediaPlayer != null) {
            try { mediaPlayer.stop(); } catch (Exception ignored) {}
            try { mediaPlayer.release(); } catch (Exception ignored) {}
            mediaPlayer = null;
        }
    }

    @Override
    public void onDestroy() {
        stopEverything();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}

