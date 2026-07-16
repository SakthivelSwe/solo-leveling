package com.thesystem.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register the native full-screen alarm plugin before the bridge starts.
        registerPlugin(SystemAlarmPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
