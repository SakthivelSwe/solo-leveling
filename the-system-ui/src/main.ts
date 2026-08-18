import { bootstrapApplication } from '@angular/platform-browser';
import { Capacitor } from '@capacitor/core';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// PERF (Android WebView): tag the DOM as native BEFORE Angular renders its first
// frame. This ensures the GPU-heavy CSS (backdrop-filter blur, infinite aurora /
// drift particle animations) is disabled on the very first paint instead of only
// after NativeService.init() runs mid-lifecycle — which was causing visible lag /
// jank on app launch. No-op on the web (isNativePlatform() === false).
if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('native-platform');
  document.body.classList.add('native-platform');
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
