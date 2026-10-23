package tech.schooloffice.admin;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.LocationManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/** JS bridge for the bus-tracking service: permission steps, start/stop, live status. */
@CapacitorPlugin(
        name = "BusTracker",
        permissions = {
                @Permission(alias = "location", strings = {Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}),
                @Permission(alias = "background", strings = {Manifest.permission.ACCESS_BACKGROUND_LOCATION}),
                @Permission(alias = "notifications", strings = {"android.permission.POST_NOTIFICATIONS"})
        }
)
public class BusTrackerPlugin extends Plugin {

    private boolean granted(String perm) {
        return ContextCompat.checkSelfPermission(getContext(), perm) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean fineOk() {
        return granted(Manifest.permission.ACCESS_FINE_LOCATION);
    }

    private boolean backgroundOk() {
        return Build.VERSION.SDK_INT < 29 || granted(Manifest.permission.ACCESS_BACKGROUND_LOCATION);
    }

    private boolean notificationsOk() {
        return Build.VERSION.SDK_INT < 33 || granted("android.permission.POST_NOTIFICATIONS");
    }

    private JSObject status() {
        Context c = getContext();
        SharedPreferences p = TrackerService.prefs(c);
        JSObject o = new JSObject();
        o.put("fineLocation", fineOk());
        o.put("backgroundLocation", backgroundOk());
        o.put("notifications", notificationsOk());
        PowerManager pm = (PowerManager) c.getSystemService(Context.POWER_SERVICE);
        o.put("batteryUnrestricted", pm != null && pm.isIgnoringBatteryOptimizations(c.getPackageName()));
        LocationManager lm = (LocationManager) c.getSystemService(Context.LOCATION_SERVICE);
        boolean gps = false;
        try { gps = lm != null && (lm.isProviderEnabled(LocationManager.GPS_PROVIDER) || lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)); } catch (Throwable ignored) { }
        o.put("gpsOn", gps);
        o.put("running", TrackerService.RUNNING);
        o.put("configured", !p.getString("token", "").isEmpty());
        o.put("userId", p.getString("user_id", ""));
        o.put("queued", p.getInt("queued", 0));
        o.put("lastSentAt", p.getLong("last_sent_at", 0));
        o.put("lastFixAt", p.getLong("last_fix_at", 0));
        o.put("lastError", p.getString("last_error", ""));
        return o;
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        call.resolve(status());
    }

    @PluginMethod
    public void requestLocation(PluginCall call) {
        if (fineOk()) { call.resolve(status()); return; }
        requestPermissionForAlias("location", call, "permissionResult");
    }

    @PluginMethod
    public void requestBackground(PluginCall call) {
        if (backgroundOk()) { call.resolve(status()); return; }
        if (!fineOk()) { call.reject("Allow location access first"); return; }
        requestPermissionForAlias("background", call, "permissionResult");
    }

    @PluginMethod
    public void requestNotifications(PluginCall call) {
        if (notificationsOk()) { call.resolve(status()); return; }
        requestPermissionForAlias("notifications", call, "permissionResult");
    }

    @PermissionCallback
    private void permissionResult(PluginCall call) {
        call.resolve(status());
    }

    @PluginMethod
    public void requestBatteryExemption(PluginCall call) {
        try {
            Intent i = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + getContext().getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        } catch (Throwable t) {
            openSettingsIntent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS, null);
        }
        call.resolve(status());
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        openSettingsIntent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getContext().getPackageName()));
        call.resolve(status());
    }

    @PluginMethod
    public void openLocationSettings(PluginCall call) {
        openSettingsIntent(Settings.ACTION_LOCATION_SOURCE_SETTINGS, null);
        call.resolve(status());
    }

    private void openSettingsIntent(String action, Uri data) {
        try {
            Intent i = new Intent(action);
            if (data != null) i.setData(data);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        } catch (Throwable ignored) { }
    }

    /** Stores the base url + tracker token and starts the service. */
    @PluginMethod
    public void start(PluginCall call) {
        String baseUrl = call.getString("baseUrl", "");
        String token = call.getString("token", "");
        String userId = call.getString("userId", "");
        if (baseUrl == null || baseUrl.isEmpty() || token == null || token.isEmpty()) {
            call.reject("baseUrl and token are required");
            return;
        }
        while (baseUrl.endsWith("/")) baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        TrackerService.prefs(getContext()).edit()
                .putString("base_url", baseUrl).putString("token", token).putString("user_id", userId == null ? "" : userId)
                .putString("last_error", "").apply();
        try { TrackerService.startIfConfigured(getContext()); } catch (Throwable t) { call.reject("Could not start tracking: " + t.getMessage()); return; }
        call.resolve(status());
    }

    /** Makes sure the service is up (e.g. after the app is opened again). */
    @PluginMethod
    public void ensureRunning(PluginCall call) {
        try { TrackerService.startIfConfigured(getContext()); } catch (Throwable ignored) { }
        call.resolve(status());
    }

    @PluginMethod
    public void stop(PluginCall call) {
        TrackerService.prefs(getContext()).edit().remove("token").apply();
        TrackerService.stop(getContext());
        call.resolve(status());
    }
}
