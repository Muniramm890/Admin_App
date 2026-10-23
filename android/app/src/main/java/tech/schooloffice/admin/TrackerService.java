package tech.schooloffice.admin;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.IBinder;
import android.os.PowerManager;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * 24x7 bus tracking. Foreground service (location type) that keeps running when the app is closed / screen is off.
 * It talks to the server NATIVELY (no WebView needed): fixes are queued on disk and posted in batches to
 * {base_url}/driver/locations with the driver's tracker token. No internet -> points wait in the queue and are
 * sent later ("last seen" on the map is simply the last successful post).
 * Everything runs on ONE background thread, so no locking is needed.
 */
public class TrackerService extends Service {
    static final String PREFS = "bus_tracker";
    static final String CH_ID = "bus_tracker";
    static final int NOTIF_ID = 4101;
    static volatile boolean RUNNING = false;

    private static final int MAX_QUEUE = 4000;
    private static final long LOC_EVERY_MS = 10000;
    private static final long SEND_EVERY_MS = 20000;
    private static final long HEARTBEAT_MS = 30000;

    private HandlerThread thread;
    private Handler handler;
    private FusedLocationProviderClient fused;
    private LocationCallback fusedCb;
    private LocationManager lm;
    private LocationListener lmListener;
    private PowerManager.WakeLock wakeLock;
    private final List<JSONObject> queue = new ArrayList<>();
    private File queueFile;
    private long lastHeartbeat = 0;

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /** Starts the service if a tracker token is stored (used by the app, boot receiver and app-update receiver). */
    public static void startIfConfigured(Context c) {
        if (prefs(c).getString("token", "").isEmpty()) return;
        ContextCompat.startForegroundService(c, new Intent(c, TrackerService.class));
    }

    public static void stop(Context c) {
        c.stopService(new Intent(c, TrackerService.class));
    }

    @Override
    public void onCreate() {
        super.onCreate();
        queueFile = new File(getFilesDir(), "tracker_queue.jsonl");
        loadQueue();
        thread = new HandlerThread("bus-tracker");
        thread.start();
        handler = new Handler(thread.getLooper());
        createChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        try {
            startForegroundCompat();
        } catch (Throwable t) { // e.g. location permission missing on Android 14+
            setErr("Cannot start tracking: " + t.getClass().getSimpleName());
            stopSelf();
            return START_NOT_STICKY;
        }
        if (!RUNNING) {
            RUNNING = true;
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "schooloffice:bus-tracker");
                wakeLock.setReferenceCounted(false);
                wakeLock.acquire();
            }
            handler.post(this::startLocationUpdates);
            handler.postDelayed(sendLoop, 5000);
        }
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        RUNNING = false;
        try { if (fused != null && fusedCb != null) fused.removeLocationUpdates(fusedCb); } catch (Throwable ignored) { }
        try { if (lm != null && lmListener != null) lm.removeUpdates(lmListener); } catch (Throwable ignored) { }
        if (handler != null) handler.removeCallbacksAndMessages(null);
        if (thread != null) thread.quitSafely();
        try { if (wakeLock != null && wakeLock.isHeld()) wakeLock.release(); } catch (Throwable ignored) { }
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    // ───────────────────────── notification ─────────────────────────
    private void createChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(CH_ID, "Bus tracking", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Shows that this phone is sharing the bus location with the school");
            ch.setShowBadge(false);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(ch);
        }
    }

    private void startForegroundCompat() {
        Intent open = new Intent(this, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification n = new NotificationCompat.Builder(this, CH_ID)
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setContentTitle("School Office - bus tracking is on")
                .setContentText("This phone is sharing the bus location with the school")
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setContentIntent(pi)
                .build();
        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(NOTIF_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
        } else {
            startForeground(NOTIF_ID, n);
        }
    }

    // ───────────────────────── location ─────────────────────────
    private boolean hasLocationPermission() {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                || ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    @SuppressLint("MissingPermission")
    private void startLocationUpdates() {
        if (!hasLocationPermission()) {
            setErr("Location permission is missing");
            return;
        }
        boolean gms = GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(this) == ConnectionResult.SUCCESS;
        if (gms) {
            fused = LocationServices.getFusedLocationProviderClient(this);
            LocationRequest req = new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, LOC_EVERY_MS)
                    .setMinUpdateIntervalMillis(5000)
                    .setWaitForAccurateLocation(false)
                    .build();
            fusedCb = new LocationCallback() {
                @Override
                public void onLocationResult(@NonNull LocationResult result) {
                    for (Location l : result.getLocations()) onFix(l);
                }
            };
            fused.requestLocationUpdates(req, fusedCb, thread.getLooper());
        } else { // phone without Google Play services: plain Android location
            lm = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
            lmListener = new LocationListener() {
                @Override
                public void onLocationChanged(@NonNull Location l) { onFix(l); }
                public void onProviderEnabled(@NonNull String provider) { }
                public void onProviderDisabled(@NonNull String provider) { }
                public void onStatusChanged(String provider, int status, Bundle extras) { }
            };
            try { lm.requestLocationUpdates(LocationManager.GPS_PROVIDER, LOC_EVERY_MS, 0f, lmListener, thread.getLooper()); } catch (Throwable ignored) { }
            try { lm.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, LOC_EVERY_MS, 0f, lmListener, thread.getLooper()); } catch (Throwable ignored) { }
        }
    }

    private void onFix(Location l) {
        try {
            JSONObject p = new JSONObject();
            p.put("lat", l.getLatitude());
            p.put("lng", l.getLongitude());
            p.put("t", l.getTime() > 0 ? l.getTime() : System.currentTimeMillis());
            if (l.hasSpeed()) p.put("speed_kmh", Math.round(l.getSpeed() * 3.6f * 10f) / 10f);
            if (l.hasBearing()) p.put("heading", l.getBearing());
            if (l.hasAccuracy()) p.put("accuracy_m", l.getAccuracy());
            queue.add(p);
            while (queue.size() > MAX_QUEUE) queue.remove(0);
            appendQueue(p);
            prefs(this).edit().putLong("last_fix_at", System.currentTimeMillis()).putInt("queued", queue.size()).apply();
        } catch (Throwable ignored) { }
    }

    // ───────────────────────── sending ─────────────────────────
    private final Runnable sendLoop = new Runnable() {
        @Override
        public void run() {
            try {
                flush();
            } catch (Throwable t) {
                setErr("Send failed: " + t.getClass().getSimpleName());
            } finally {
                if (RUNNING) handler.postDelayed(this, SEND_EVERY_MS);
            }
        }
    };

    private void flush() throws Exception {
        SharedPreferences p = prefs(this);
        String token = p.getString("token", "");
        String base = p.getString("base_url", "");
        if (token.isEmpty() || base.isEmpty()) { stopSelf(); return; }

        for (int round = 0; round < 10; round++) { // drain a backlog quickly after being offline
            int n = Math.min(200, queue.size());
            long now = System.currentTimeMillis();
            if (n == 0 && now - lastHeartbeat < HEARTBEAT_MS) return;

            JSONArray arr = new JSONArray();
            for (int i = 0; i < n; i++) arr.put(queue.get(i));
            JSONObject body = new JSONObject();
            body.put("points", arr);
            body.put("battery", battery());
            body.put("app_version", appVersion());
            body.put("device", Build.MANUFACTURER + " " + Build.MODEL);
            byte[] data = body.toString().getBytes(StandardCharsets.UTF_8);

            int code;
            HttpURLConnection c = null;
            try {
                c = (HttpURLConnection) new URL(base + "/driver/locations").openConnection();
                c.setRequestMethod("POST");
                c.setConnectTimeout(15000);
                c.setReadTimeout(20000);
                c.setDoOutput(true);
                c.setFixedLengthStreamingMode(data.length);
                c.setRequestProperty("Content-Type", "application/json");
                c.setRequestProperty("Authorization", "Bearer " + token);
                try (OutputStream os = c.getOutputStream()) { os.write(data); }
                code = c.getResponseCode();
                try (InputStream is = code >= 400 ? c.getErrorStream() : c.getInputStream()) {
                    if (is != null) { byte[] buf = new byte[1024]; while (is.read(buf) > 0) { /* drain */ } }
                }
            } catch (java.io.IOException io) { // no internet / timeout -> keep the points, try again later
                setErr("No internet connection");
                return;
            } finally {
                if (c != null) c.disconnect();
            }

            if (code >= 200 && code < 300) {
                for (int i = 0; i < n && !queue.isEmpty(); i++) queue.remove(0);
                rewriteQueue();
                lastHeartbeat = now;
                p.edit().putLong("last_sent_at", now).putString("last_error", "").putInt("queued", queue.size()).apply();
                if (queue.isEmpty()) return;
            } else if (code == 401 || code == 403) { // token revoked / user deactivated
                p.edit().remove("token").putString("last_error", "Tracking was switched off by the school").apply();
                stopSelf();
                return;
            } else {
                setErr("Server error " + code);
                return;
            }
        }
    }

    private int battery() {
        try {
            BatteryManager bm = (BatteryManager) getSystemService(Context.BATTERY_SERVICE);
            return bm == null ? -1 : bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY);
        } catch (Throwable t) { return -1; }
    }

    private String appVersion() {
        try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionName; } catch (Throwable t) { return ""; }
    }

    private void setErr(String s) {
        prefs(this).edit().putString("last_error", s).apply();
    }

    // ───────────────────────── disk queue ─────────────────────────
    private void loadQueue() {
        if (!queueFile.exists()) return;
        try (BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(queueFile), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                try { queue.add(new JSONObject(line)); } catch (Throwable ignored) { }
            }
        } catch (Throwable ignored) { }
        while (queue.size() > MAX_QUEUE) queue.remove(0);
    }

    private void appendQueue(JSONObject p) {
        try (FileOutputStream fo = new FileOutputStream(queueFile, true)) {
            fo.write((p.toString() + "\n").getBytes(StandardCharsets.UTF_8));
        } catch (Throwable ignored) { }
    }

    private void rewriteQueue() {
        try (FileOutputStream fo = new FileOutputStream(queueFile, false)) {
            for (JSONObject p : queue) fo.write((p.toString() + "\n").getBytes(StandardCharsets.UTF_8));
        } catch (Throwable ignored) { }
    }
}
