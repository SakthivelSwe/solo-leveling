package com.thesystem.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register the native full-screen alarm plugin before the bridge starts.
        registerPlugin(SystemAlarmPlugin.class);
        registerPlugin(ScreenTimePlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onNewIntent(android.content.Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
    }

    @Override
    public void onResume() {
        super.onResume();
        android.content.Intent intent = getIntent();
        if (intent != null && intent.getBooleanExtra("PENALTY_TRIGGER", false)) {
            String app = intent.getStringExtra("DISTRACTING_APP");
            // Clear the flag so it doesn't fire again on rotation
            intent.removeExtra("PENALTY_TRIGGER");
            
            com.getcapacitor.JSObject ret = new com.getcapacitor.JSObject();
            ret.put("app", app);
            bridge.triggerJSEvent("penaltyTriggered", "window", ret.toString());
        }
    }
}
