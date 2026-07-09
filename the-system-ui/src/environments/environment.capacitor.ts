export const environment = {
  production: true,
  // Running inside the Capacitor Android WebView. Disables the Angular service
  // worker (Capacitor serves the bundle locally, so a SW would only interfere)
  // and switches on the native glue in NativeService.
  native: true,
  // ── Android backend URL ──────────────────────────────────────────────
  // The Android EMULATOR maps 10.0.2.2 → your PC's localhost, so this reaches
  // the Spring Boot API running on the host at :8080.
  //
  // For a PHYSICAL device on the same Wi-Fi, change this to your PC's LAN IP,
  // e.g.  http://192.168.1.20:8080/api   (run `ipconfig` to find it).
  // For production, point this at your deployed HTTPS backend.
  apiUrl: 'http://10.0.2.2:8080/api',
};

