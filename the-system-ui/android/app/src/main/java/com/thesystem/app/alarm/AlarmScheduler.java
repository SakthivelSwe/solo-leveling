package com.thesystem.app.alarm;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;

import java.util.Calendar;

/**
 * Schedules / cancels the exact wake alarms using {@link AlarmManager#setAlarmClock}.
 *
 * setAlarmClock is used deliberately: it is exempt from Doze mode and from the
 * SCHEDULE_EXACT_ALARM permission gate, shows the system "alarm" status-bar
 * icon, and is the API real alarm-clock apps use. One alarm is scheduled per
 * active weekday (request codes 7000..7006); a one-shot snooze uses 7100.
 */
public final class AlarmScheduler {

    public static final String ACTION_ALARM_FIRE = "com.thesystem.app.ALARM_FIRE";
    public static final String EXTRA_SNOOZE = "snooze";

    private static final int REQ_BASE = 7000;   // + dayIndex (0..6)
    private static final int REQ_SNOOZE = 7100;

    private AlarmScheduler() {}

    /** Rebuild every weekly alarm from the persisted config. Idempotent. */
    public static void scheduleAll(Context context) {
        AlarmPrefs prefs = new AlarmPrefs(context);
        cancelAll(context);
        if (!prefs.isEnabled()) return;

        AlarmManager am = context.getSystemService(AlarmManager.class);
        if (am == null) return;

        boolean[] days = prefs.getDays();
        int hour = prefs.getHour();
        int minute = prefs.getMinute();

        for (int i = 0; i < 7; i++) {
            if (!days[i]) continue;
            long triggerAt = nextTrigger(i + 1 /* Calendar day-of-week */, hour, minute);
            PendingIntent fire = firePendingIntent(context, REQ_BASE + i, false);
            PendingIntent show = showPendingIntent(context);
            am.setAlarmClock(new AlarmManager.AlarmClockInfo(triggerAt, show), fire);
        }
    }

    /** Schedule a one-shot snooze alarm {minutes} from now. */
    public static void scheduleSnooze(Context context, int minutes) {
        AlarmManager am = context.getSystemService(AlarmManager.class);
        if (am == null) return;
        long triggerAt = System.currentTimeMillis() + (long) minutes * 60_000L;
        PendingIntent fire = firePendingIntent(context, REQ_SNOOZE, true);
        PendingIntent show = showPendingIntent(context);
        am.setAlarmClock(new AlarmManager.AlarmClockInfo(triggerAt, show), fire);
    }

    /** Cancel every weekly alarm and any pending snooze. */
    public static void cancelAll(Context context) {
        AlarmManager am = context.getSystemService(AlarmManager.class);
        if (am == null) return;
        for (int i = 0; i < 7; i++) {
            am.cancel(firePendingIntent(context, REQ_BASE + i, false));
        }
        am.cancel(firePendingIntent(context, REQ_SNOOZE, true));
    }

    /** Compute the next epoch-millis for the given Calendar day-of-week + time. */
    private static long nextTrigger(int calDayOfWeek, int hour, int minute) {
        Calendar now = Calendar.getInstance();
        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, hour);
        c.set(Calendar.MINUTE, minute);
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        int todayDow = c.get(Calendar.DAY_OF_WEEK);
        int delta = (calDayOfWeek - todayDow + 7) % 7;
        c.add(Calendar.DAY_OF_MONTH, delta);
        if (!c.after(now)) c.add(Calendar.DAY_OF_MONTH, 7);
        return c.getTimeInMillis();
    }

    private static PendingIntent firePendingIntent(Context context, int requestCode, boolean snooze) {
        Intent i = new Intent(context, AlarmReceiver.class);
        i.setAction(ACTION_ALARM_FIRE);
        i.putExtra(EXTRA_SNOOZE, snooze);
        // Unique data so the 7 PendingIntents don't collapse into one.
        i.setData(android.net.Uri.parse("systemalarm://fire/" + requestCode));
        return PendingIntent.getBroadcast(
                context, requestCode, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Tapping the status-bar alarm icon opens the ringing screen. */
    private static PendingIntent showPendingIntent(Context context) {
        Intent i = new Intent(context, AlarmActivity.class);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return PendingIntent.getActivity(
                context, 7200, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}

