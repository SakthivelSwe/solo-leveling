package com.thesystem.app;

import android.os.Bundle;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

/**
 * Single Activity that hosts the Capacitor WebView.
 *
 * Performance / correctness additions (2026-08):
 *  - Explicitly sets FLAG_HARDWARE_ACCELERATED before super.onCreate so the
 *    WebView compositor always uses GPU layers, even on devices where the
 *    manifest flag alone is not picked up early enough.
 *  - Reads the "route" Intent extra that the TopicWidget and BootReceiver can
 *    inject, and forwards it to Angular via a JS event once the bridge is ready.
 *  - Handles PENALTY_TRIGGER from ScreenTimeService (existing logic preserved).
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // ① Force hardware acceleration on the window before any view is inflated.
        //    The manifest already sets android:hardwareAccelerated="true" but setting
        //    the flag here guarantees it is applied before Capacitor creates the WebView.
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED);

        // ② Register native plugins before the bridge starts.
        registerPlugin(SystemAlarmPlugin.class);
        registerPlugin(ScreenTimePlugin.class);

        super.onCreate(savedInstanceState);

        // ③ Handle deep-link route from the home-screen widget or notification tap.
        handleRouteIntent(getIntent());
    }

    @Override
    public void onNewIntent(android.content.Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleRouteIntent(intent);
    }

    @Override
    public void onResume() {
        super.onResume();
        android.content.Intent intent = getIntent();
        if (intent != null && intent.getBooleanExtra("PENALTY_TRIGGER", false)) {
            String app = intent.getStringExtra("DISTRACTING_APP");
            // Clear the flag so it doesn't fire again on rotation.
            intent.removeExtra("PENALTY_TRIGGER");

            com.getcapacitor.JSObject ret = new com.getcapacitor.JSObject();
            ret.put("app", app);
            bridge.triggerJSEvent("penaltyTriggered", "window", ret.toString());
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Reads the "route" String extra (e.g. "/habits") from an Intent and fires
     * a JS event so Angular Router can navigate there once the bridge is ready.
     * The TopicWidget and any push-notification tap can inject this extra.
     */
    private void handleRouteIntent(android.content.Intent intent) {
        if (intent == null) return;
        String route = intent.getStringExtra("route");
        if (route == null || route.isEmpty()) return;
        // Clear the extra so rotation / re-resume doesn't re-fire the navigation.
        intent.removeExtra("route");

        if (bridge != null) {
            com.getcapacitor.JSObject payload = new com.getcapacitor.JSObject();
            payload.put("url", route);
            bridge.triggerJSEvent("appUrlOpen", "window", payload.toString());
        } else {
            // Bridge not ready yet — post to main looper after a short delay.
            new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                if (bridge != null) {
                    com.getcapacitor.JSObject payload = new com.getcapacitor.JSObject();
                    payload.put("url", route);
                    bridge.triggerJSEvent("appUrlOpen", "window", payload.toString());
                }
            }, 1200);
        }
    }
}
