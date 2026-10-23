package tech.schooloffice.admin;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BusTrackerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
