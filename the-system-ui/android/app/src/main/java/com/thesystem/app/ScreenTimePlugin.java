package com.thesystem.app;

import android.app.AppOpsManager;
import android.content.Context;
import android.content.Intent;
import android.provider.Settings;
import android.os.Process;

import com.getcapacitor.JSArray;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONException;
import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "ScreenTime")
public class ScreenTimePlugin extends Plugin {

    @PluginMethod
    public void hasUsagePermission(PluginCall call) {
        Context context = getContext();
        AppOpsManager appOps = (AppOpsManager) context.getSystemService(Context.APP_OPS_SERVICE);
        int mode = appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, 
            Process.myUid(), context.getPackageName());
        
        call.resolve(new com.getcapacitor.JSObject().put("granted", mode == AppOpsManager.MODE_ALLOWED));
    }

    @PluginMethod
    public void requestUsagePermission(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void startPenaltyEnforcement(PluginCall call) {
        JSArray apps = call.getArray("blacklistedPackages");
        ArrayList<String> packageList = new ArrayList<>();
        if (apps != null) {
            try {
                for (int i = 0; i < apps.length(); i++) {
                    packageList.add(apps.getString(i));
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
        
        Intent intent = new Intent(getContext(), ScreenTimeService.class);
        intent.putStringArrayListExtra("blacklisted", packageList);
        intent.putExtra("lockdownMode", false);
        getContext().startForegroundService(intent);
        call.resolve();
    }

    @PluginMethod
    public void initiateLockdown(PluginCall call) {
        Intent intent = new Intent(getContext(), ScreenTimeService.class);
        intent.putExtra("lockdownMode", true);
        getContext().startForegroundService(intent);
        call.resolve();
    }

    @PluginMethod
    public void stopPenaltyEnforcement(PluginCall call) {
        Intent intent = new Intent(getContext(), ScreenTimeService.class);
        getContext().stopService(intent);
        call.resolve();
    }
}
