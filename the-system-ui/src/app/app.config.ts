import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withPreloading, PreloadAllModules } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { fallbackInterceptor } from './core/interceptors/fallback.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // eventCoalescing + runCoalescing batch Angular change-detection cycles together,
    // reducing the number of digest passes per frame — especially on rapid tap events.
    provideZoneChangeDetection({ eventCoalescing: true, runCoalescing: true }),

    // withPreloading(PreloadAllModules) eagerly downloads lazy chunks in the background
    // so navigating between tabs has zero network delay.
    // Removed withViewTransitions() to eliminate artificial crossfade delays and freezing.
    provideRouter(routes, withComponentInputBinding(), withPreloading(PreloadAllModules)),

    // Async animations: defers the BrowserAnimationsModule load until after first paint
    // so the initial bundle is smaller and cold-start is faster on Android.
    provideAnimationsAsync(),

    // fallbackInterceptor must run BEFORE errorInterceptor so it catches raw network errors
    provideHttpClient(withInterceptors([jwtInterceptor, fallbackInterceptor, errorInterceptor])),

    provideServiceWorker('ngsw-worker.js', {
      // Disabled inside the native WebView (environment.native) — Capacitor
      // serves the bundle locally, so the Angular SW is web-only.
      enabled: environment.production && !environment.native,
      registrationStrategy: 'registerWhenStable:30000',
    }),

      ]
};
