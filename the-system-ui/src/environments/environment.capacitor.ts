export const environment = {
  production: true,
  // Running inside the Capacitor Android WebView. Disables the Angular service
  // worker (Capacitor serves the bundle locally, so a SW would only interfere)
  // and switches on the native glue in NativeService.
  native: true,
  // ── Android backend URL ──────────────────────────────────────────────
  // Points to the deployed backend on Render (HTTPS).
  // For local dev, change this back to http://10.0.2.2:8080/api (emulator)
  // or http://<your-lan-ip>:8080/api (physical device).
  apiUrl: 'https://solo-leveling-0rpl.onrender.com/api/v1',
};
