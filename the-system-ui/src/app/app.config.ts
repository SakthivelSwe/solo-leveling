import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideAnimations(),
    provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor])),
    provideServiceWorker('ngsw-worker.js', {
      // Disabled inside the native WebView (environment.native) — Capacitor
      // serves the bundle locally, so the Angular SW is web-only.
      enabled: environment.production && !environment.native,
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ]
};
