import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  return next(req).pipe(
    catchError((err) => {
      // 401 = invalid/expired token, 403 = token valid but user no longer exists
      // (e.g. in-memory DB was reset on backend restart). Both mean "session is dead".
      const isAuthFailure = (err.status === 401 || err.status === 403) && !req.url.includes('/auth/');
      if (isAuthFailure) {
        localStorage.removeItem('system_access_token');
        localStorage.removeItem('system_refresh_token');
        localStorage.removeItem('system_player');
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};

