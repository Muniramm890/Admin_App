package tech.schooloffice.admin;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Restarts bus tracking after the phone reboots or the app is updated (no need to open the app). */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String a = intent == null ? null : intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(a) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(a)) {
            try { TrackerService.startIfConfigured(context); } catch (Throwable ignored) { }
        }
    }
}
