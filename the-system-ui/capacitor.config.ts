import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.thesystem.app',
  appName: 'THE SYSTEM',
  // The Angular production build output that gets bundled into the native app.
  webDir: 'dist/the-system-ui/browser',
  backgroundColor: '#060610',

  // ── Logging ──────────────────────────────────────────────────────────────
  // 'none' silences the verbose Capacitor bridge log output in production,
  // which otherwise fires on every single JS→native call and slows the bridge.
  loggingBehavior: 'none',

  android: {
    backgroundColor: '#060610',
    // Mixed content DISABLED — the backend is now served over HTTPS (Render).
    allowMixedContent: false,
    // Do NOT expose WebView remote debugging in production builds.
    // Set to true temporarily during development if needed.
    webContentsDebuggingEnabled: false,
    // Minimize initial focus delay — prevents the 300ms focus-bounce on first tap.
    initialFocus: false,
  },
  server: {
    // Use HTTPS scheme for production — the Render backend is HTTPS-only.
    androidScheme: 'https',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#060610',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#060610',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
