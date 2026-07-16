package com.thesystem.app.alarm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

/**
 * Receives the exact-alarm broadcast from {@link AlarmScheduler} when a wake
 * alarm fires, then starts the foreground {@link AlarmService} which plays the
 * user's chosen sound and shows the full-screen ringing screen.
 *
 * Starting a foreground service from here is allowed even from the background
 * because the app used setAlarmClock()/exact alarms (an OS exemption).
 */
public class AlarmReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        // Start the ringing service.
        Intent svc = new Intent(context, AlarmService.class);
        svc.setAction(AlarmService.ACTION_START);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(svc);
        } else {
            context.startService(svc);
        }

        // Re-arm next week's occurrences (snooze is one-shot so it just expires).
        boolean snooze = intent.getBooleanExtra(AlarmScheduler.EXTRA_SNOOZE, false);
        if (!snooze) {
            AlarmScheduler.scheduleAll(context);
        }
    }
}

