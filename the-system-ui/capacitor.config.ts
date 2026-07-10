import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.thesystem.app',
  appName: 'THE SYSTEM',
  // The Angular production build output that gets bundled into the native app.
  webDir: 'dist/the-system-ui/browser',
  backgroundColor: '#060610',
  android: {
    backgroundColor: '#060610',
    // Mixed content DISABLED — the backend is now served over HTTPS (Render).
    allowMixedContent: false,
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
  },
};

export default config;
