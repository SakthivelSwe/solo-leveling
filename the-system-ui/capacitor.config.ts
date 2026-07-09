import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.thesystem.app',
  appName: 'THE SYSTEM',
  // The Angular production build output that gets bundled into the native app.
  webDir: 'dist/the-system-ui/browser',
  backgroundColor: '#060610',
  android: {
    backgroundColor: '#060610',
    // Mixed content DISABLED for production. The Angular bundle is served from
    // the app's WebView origin (http://localhost inside Capacitor) and only
    // talks to the private LAN backend allow-listed in network_security_config.xml.
    allowMixedContent: false,
  },
  server: {
    // Use the http scheme so the WebView (origin http://localhost) can call the
    // cleartext dev backend without mixed-content blocking. For a production
    // release with an HTTPS backend, switch androidScheme back to 'https'.
    androidScheme: 'http',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
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

