import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';

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

    // withViewTransitions() uses the native View Transitions API for smooth
    // page-to-page animations without Angular's JS animation engine overhead.
    // withComponentInputBinding() allows route params to bind directly to @Input().
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),

    // Async animations: defers the BrowserAnimationsModule load until after first paint
    // so the initial bundle is smaller and cold-start is faster on Android.
    provideAnimationsAsync(),

    // fallbackInterceptor must run BEFORE errorInterceptor so it catches raw network errors
    provideHttpClient(withInterceptors([jwtInterceptor, fallbackInterceptor, errorInterceptor])),

    importProvidersFrom(MonacoEditorModule.forRoot({
      baseUrl: 'assets/monaco',
      defaultOptions: { scrollBeyondLastLine: false, theme: 'vs-dark' }
    })),

    provideServiceWorker('ngsw-worker.js', {
      // Disabled inside the native WebView (environment.native) — Capacitor
      // serves the bundle locally, so the Angular SW is web-only.
      enabled: environment.production && !environment.native,
      registrationStrategy: 'registerWhenStable:30000',
    }),

    { 
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, 
      useValue: { horizontalPosition: 'right', verticalPosition: 'top', duration: 3000 } 
    }
  ]
};
