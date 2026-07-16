package com.thesystem.app.alarm;

import android.content.Context;
import android.content.SharedPreferences;

/**
 * Persistent store for the single user wake-alarm configuration.
 *
 * Everything the alarm needs to ring (time, active weekdays, label, the chosen
 * local sound URI and the vibrate flag) is kept here so the {@link AlarmService}
 * and {@link BootReceiver} can rebuild the alarm without the WebView/Angular
 * layer being alive. This is what lets the alarm fire when the app is fully
 * closed or after a reboot.
 */
public final class AlarmPrefs {

    private static final String FILE = "system_alarm_prefs";
    private static final String K_ENABLED = "enabled";
    private static final String K_HOUR = "hour";
    private static final String K_MINUTE = "minute";
    private static final String K_DAYS = "days";       // 7 chars, index 0=Sunday..6=Saturday
    private static final String K_LABEL = "label";
    private static final String K_SOUND_URI = "soundUri";
    private static final String K_SOUND_NAME = "soundName";
    private static final String K_VIBRATE = "vibrate";
    private static final String K_SNOOZE_MIN = "snoozeMinutes";

    private final SharedPreferences prefs;

    public AlarmPrefs(Context context) {
        this.prefs = context.getApplicationContext().getSharedPreferences(FILE, Context.MODE_PRIVATE);
    }

    public boolean isEnabled()      { return prefs.getBoolean(K_ENABLED, false); }
    public int getHour()            { return prefs.getInt(K_HOUR, 7); }
    public int getMinute()          { return prefs.getInt(K_MINUTE, 0); }
    public String getLabel()        { return prefs.getString(K_LABEL, "WAKE PROTOCOL"); }
    public String getSoundUri()     { return prefs.getString(K_SOUND_URI, ""); }
    public String getSoundName()    { return prefs.getString(K_SOUND_NAME, ""); }
    public boolean isVibrate()      { return prefs.getBoolean(K_VIBRATE, true); }
    public int getSnoozeMinutes()   { return prefs.getInt(K_SNOOZE_MIN, 9); }

    /** @return 7-length array, index 0=Sunday .. 6=Saturday. */
    public boolean[] getDays() {
        String raw = prefs.getString(K_DAYS, "1111111");
        boolean[] days = new boolean[7];
        for (int i = 0; i < 7 && i < raw.length(); i++) {
            days[i] = raw.charAt(i) == '1';
        }
        return days;
    }

    public void save(boolean enabled, int hour, int minute, boolean[] days,
                     String label, String soundUri, String soundName,
                     boolean vibrate, int snoozeMinutes) {
        StringBuilder d = new StringBuilder();
        for (int i = 0; i < 7; i++) d.append(days != null && i < days.length && days[i] ? '1' : '0');
        prefs.edit()
                .putBoolean(K_ENABLED, enabled)
                .putInt(K_HOUR, hour)
                .putInt(K_MINUTE, minute)
                .putString(K_DAYS, d.toString())
                .putString(K_LABEL, label != null ? label : "WAKE PROTOCOL")
                .putString(K_SOUND_URI, soundUri != null ? soundUri : "")
                .putString(K_SOUND_NAME, soundName != null ? soundName : "")
                .putBoolean(K_VIBRATE, vibrate)
                .putInt(K_SNOOZE_MIN, snoozeMinutes)
                .apply();
    }

    public void setEnabled(boolean enabled) {
        prefs.edit().putBoolean(K_ENABLED, enabled).apply();
    }
}

