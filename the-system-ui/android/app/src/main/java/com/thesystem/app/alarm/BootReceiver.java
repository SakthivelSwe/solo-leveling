package com.thesystem.app.alarm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Re-schedules the wake alarm after events that wipe pending alarms:
 * device reboot, a manual clock change, or a timezone change. Without this the
 * alarm would silently stop working after the phone restarts.
 */
public class BootReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (action == null) return;
        switch (action) {
            case Intent.ACTION_BOOT_COMPLETED:
            case "android.intent.action.LOCKED_BOOT_COMPLETED":
            case Intent.ACTION_TIME_CHANGED:
            case Intent.ACTION_TIMEZONE_CHANGED:
            case Intent.ACTION_MY_PACKAGE_REPLACED:
                AlarmScheduler.scheduleAll(context);
                break;
            default:
                break;
        }
    }
}

