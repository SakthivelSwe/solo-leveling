package com.thesystem.app;

import android.app.Activity;
import android.app.NotificationManager;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.OpenableColumns;
import android.provider.Settings;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.thesystem.app.alarm.AlarmPrefs;
import com.thesystem.app.alarm.AlarmScheduler;
import com.thesystem.app.alarm.AlarmService;

/**
 * Capacitor bridge for the native full-screen wake alarm.
 *
 * Exposed to Angular as the "SystemAlarm" plugin:
 *   - pickSound()          → open the Storage Access Framework file picker so the
 *                            user chooses a local MP3; we persist read access.
 *   - setAlarm(...)        → persist config + schedule exact weekly alarms.
 *   - cancelAlarm()        → cancel everything.
 *   - getAlarm()           → current persisted config.
 *   - dismiss()            → stop a currently-ringing alarm.
 *   - canUseFullScreenIntent() / openFullScreenIntentSettings() → Android 14+ gate.
 */
@CapacitorPlugin(name = "SystemAlarm")
public class SystemAlarmPlugin extends Plugin {

    @PluginMethod
    public void pickSound(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("audio/*");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION
                | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        startActivityForResult(call, intent, "pickSoundResult");
    }

    @ActivityCallback
    private void pickSoundResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null
                || result.getData().getData() == null) {
            call.reject("cancelled");
            return;
        }
        Uri uri = result.getData().getData();
        try {
            getContext().getContentResolver().takePersistableUriPermission(
                    uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
        } catch (Exception ignored) { /* some providers don't grant persist; still usable this session */ }

        JSObject ret = new JSObject();
        ret.put("uri", uri.toString());
        ret.put("name", displayName(uri));
        call.resolve(ret);
    }

    @PluginMethod
    public void setAlarm(PluginCall call) {
        int hour = call.getInt("hour", 7);
        int minute = call.getInt("minute", 0);
        String label = call.getString("label", "WAKE PROTOCOL");
        String soundUri = call.getString("soundUri", "");
        String soundName = call.getString("soundName", "");
        boolean vibrate = call.getBoolean("vibrate", true);
        int snoozeMinutes = call.getInt("snoozeMinutes", 9);

        boolean[] days = new boolean[7];
        JSArray daysArr = call.getArray("days");
        if (daysArr != null) {
            for (int i = 0; i < 7 && i < daysArr.length(); i++) {
                days[i] = daysArr.optBoolean(i, false);
            }
        } else {
            for (int i = 0; i < 7; i++) days[i] = true;
        }

        new AlarmPrefs(getContext()).save(true, hour, minute, days, label,
                soundUri, soundName, vibrate, snoozeMinutes);
        AlarmScheduler.scheduleAll(getContext());

        JSObject ret = new JSObject();
        ret.put("scheduled", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void cancelAlarm(PluginCall call) {
        AlarmScheduler.cancelAll(getContext());
        new AlarmPrefs(getContext()).setEnabled(false);
        // Stop it if it's ringing right now.
        try {
            getContext().startService(new Intent(getContext(), AlarmService.class)
                    .setAction(AlarmService.ACTION_DISMISS));
        } catch (Exception ignored) {}
        call.resolve();
    }

    @PluginMethod
    public void getAlarm(PluginCall call) {
        AlarmPrefs prefs = new AlarmPrefs(getContext());
        boolean[] days = prefs.getDays();
        JSArray daysArr = new JSArray();
        for (boolean d : days) daysArr.put(d);

        JSObject ret = new JSObject();
        ret.put("enabled", prefs.isEnabled());
        ret.put("hour", prefs.getHour());
        ret.put("minute", prefs.getMinute());
        ret.put("label", prefs.getLabel());
        ret.put("soundUri", prefs.getSoundUri());
        ret.put("soundName", prefs.getSoundName());
        ret.put("vibrate", prefs.isVibrate());
        ret.put("snoozeMinutes", prefs.getSnoozeMinutes());
        ret.put("days", daysArr);
        call.resolve(ret);
    }

    @PluginMethod
    public void dismiss(PluginCall call) {
        try {
            getContext().startService(new Intent(getContext(), AlarmService.class)
                    .setAction(AlarmService.ACTION_DISMISS));
        } catch (Exception ignored) {}
        call.resolve();
    }

    @PluginMethod
    public void canUseFullScreenIntent(PluginCall call) {
        boolean allowed = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            NotificationManager nm = getContext().getSystemService(NotificationManager.class);
            allowed = nm == null || nm.canUseFullScreenIntent();
        }
        JSObject ret = new JSObject();
        ret.put("allowed", allowed);
        call.resolve(ret);
    }

    @PluginMethod
    public void openFullScreenIntentSettings(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                Intent i = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT);
                i.setData(Uri.parse("package:" + getContext().getPackageName()));
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
            }
        } catch (Exception ignored) {}
        call.resolve();
    }

    private String displayName(Uri uri) {
        String name = null;
        try (Cursor c = getContext().getContentResolver().query(uri, null, null, null, null)) {
            if (c != null && c.moveToFirst()) {
                int idx = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (idx >= 0) name = c.getString(idx);
            }
        } catch (Exception ignored) {}
        if (name == null) {
            String path = uri.getLastPathSegment();
            name = path != null ? path : "Selected sound";
        }
        return name;
    }
}

