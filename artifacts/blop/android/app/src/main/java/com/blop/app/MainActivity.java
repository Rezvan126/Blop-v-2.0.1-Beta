package com.blop.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Enable edge-to-edge support so the webview can fill the entire screen
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}
