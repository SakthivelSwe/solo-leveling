import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const TOKEN_KEY   = 'system_access_token';
const REFRESH_KEY = 'system_refresh_token';
const PLAYER_KEY  = 'system_player';

/** Prevents multiple simultaneous refresh calls */
let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<string | null>(null);
/** Sentinel pushed to queued requests when the refresh itself fails, so they
 *  error out cleanly instead of hanging forever on a spinner. */
const REFRESH_FAILED = '__refresh_failed__';

function doLogout(router: Router): void {
  isRefreshing = false;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(PLAYER_KEY);
  router.navigate(['/login']);
}

export const errorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const router = inject(Router);
  const http   = inject(HttpClient);

  return next(req).pipe(
    catchError((err) => {
      // Only intercept 401s that are NOT from the auth endpoints themselves.
      // UX-5 FIX: 403 (Forbidden) means "authenticated but not authorized" —
      // it should NOT trigger a token refresh. Show the error directly.
      const isAuthEndpoint = req.url.includes('/auth/');
      const is401 = err.status === 401;

      if (is401 && !isAuthEndpoint) {
        const refreshToken = localStorage.getItem(REFRESH_KEY);

        // No refresh token stored → hard logout
        if (!refreshToken) {
          doLogout(router);
          return throwError(() => err);
        }

        if (isRefreshing) {
          // Another request is already refreshing — queue this one to retry once refresh completes
          return refreshDone$.pipe(
            filter(token => token !== null),
            take(1),
            switchMap(newToken => {
              // Refresh failed while we were queued → error out (don't hang).
              if (newToken === REFRESH_FAILED) {
                return throwError(() => err);
              }
              const retried = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
              return next(retried);
            }),
          );
        }

        // Start the refresh flow
        isRefreshing = true;
        refreshDone$.next(null);

        return http.post<{ accessToken: string; refreshToken: string }>(
          `${environment.apiUrl}/auth/refresh`,
          {},
          { headers: { 'Refresh-Token': refreshToken } },
        ).pipe(
          switchMap(res => {
            isRefreshing = false;
            localStorage.setItem(TOKEN_KEY, res.accessToken);
            // Refresh token rotation — store the new one if backend rotates it
            if (res.refreshToken) {
              localStorage.setItem(REFRESH_KEY, res.refreshToken);
            }
            refreshDone$.next(res.accessToken);
            // Retry the original request with the fresh token
            const retried = req.clone({ setHeaders: { Authorization: `Bearer ${res.accessToken}` } });
            return next(retried);
          }),
          catchError(refreshErr => {
            // Refresh itself failed (expired/invalid refresh token) → hard logout.
            // Unblock any queued requests so they error out instead of hanging.
            refreshDone$.next(REFRESH_FAILED);
            doLogout(router);
            return throwError(() => refreshErr);
          }),
        );
      }

      return throwError(() => err);
    }),
  );
};
