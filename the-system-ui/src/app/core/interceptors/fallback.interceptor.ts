import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export const fallbackInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  return next(req).pipe(
    catchError((err) => {
      // If we encounter a network error (0) or gateway error (502, 503, 504)
      if (err.status === 0 || err.status === 502 || err.status === 503 || err.status === 504) {
        // If the request was made to the primary API URL and we have a secondary API URL configured
        if (environment.apiUrl && environment.secondaryApiUrl && req.url.startsWith(environment.apiUrl)) {
          console.warn(Primary API failed with status  for , falling back to secondary API...);
          
          const fallbackUrl = req.url.replace(environment.apiUrl, environment.secondaryApiUrl);
          const retriedReq = req.clone({ url: fallbackUrl });
          
          return next(retriedReq);
        }
      }
      return throwError(() => err);
    })
  );
};
