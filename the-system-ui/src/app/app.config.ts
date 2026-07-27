import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideAnimations(),
    provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor])),
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
  ]
};
