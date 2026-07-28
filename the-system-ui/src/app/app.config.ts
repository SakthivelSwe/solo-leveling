import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
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
    provideRouter(routes, withComponentInputBinding()),
    provideAnimations(),
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
