package com.thesystem.app.alarm;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

import com.thesystem.app.R;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Full-screen "alarm ringing" screen that appears OVER the lock screen and
 * turns the display on. Shows the current time + alarm label and offers
 * SNOOZE / DISMISS, which talk back to {@link AlarmService}.
 */
public class AlarmActivity extends Activity {

    private final Handler handler = new Handler(Looper.getMainLooper());
    private TextView clock;
    private final Runnable tick = new Runnable() {
        @Override public void run() {
            if (clock != null) {
                clock.setText(new SimpleDateFormat("HH:mm", Locale.getDefault()).format(new Date()));
            }
            handler.postDelayed(this, 1000);
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        showOverLockScreen();
        setContentView(R.layout.activity_alarm);

        clock = findViewById(R.id.alarm_time);
        TextView label = findViewById(R.id.alarm_label);
        Button dismiss = findViewById(R.id.btn_dismiss);
        Button snooze = findViewById(R.id.btn_snooze);

        String text = new AlarmPrefs(this).getLabel();
        label.setText("\u25C8 " + (text == null || text.isEmpty() ? "WAKE PROTOCOL" : text));

        dismiss.setOnClickListener(v -> {
            sendToService(AlarmService.ACTION_DISMISS);
            finish();
        });
        snooze.setOnClickListener(v -> {
            sendToService(AlarmService.ACTION_SNOOZE);
            finish();
        });
    }

    private void showOverLockScreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager km = getSystemService(KeyguardManager.class);
            if (km != null) km.requestDismissKeyguard(this, null);
        } else {
            getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                            | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                            | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    private void sendToService(String action) {
        try {
            startService(new Intent(this, AlarmService.class).setAction(action));
        } catch (Exception ignored) {}
    }

    @Override
    protected void onResume() {
        super.onResume();
        // If the alarm was already dismissed elsewhere, don't linger.
        if (!AlarmService.isRinging) {
            finish();
            return;
        }
        handler.post(tick);
    }

    @Override
    protected void onPause() {
        super.onPause();
        handler.removeCallbacks(tick);
    }

    @Override
    public void onBackPressed() {
        // Block back so the user must explicitly snooze or dismiss.
    }
}

