import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ConfigService } from './config.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;

  constructor(
    private authService: AuthService,
    private configService: ConfigService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    request = this.addTenantAndTokenToRequest(request);

    return next.handle(request).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse && error.status === 401 && !this.isRefreshing) {
          this.isRefreshing = true;

          return this.authService.refreshAccessToken().pipe(
            switchMap((response) => {
              this.isRefreshing = false;
              return next.handle(this.addTenantAndTokenToRequest(request, response.access));
            }),
            catchError((refreshError) => {
              this.isRefreshing = false;
              this.authService.logout();
              return throwError(() => refreshError);
            })
          );
        }

        return throwError(() => error);
      })
    );
  }

  private addTenantAndTokenToRequest(
    request: HttpRequest<unknown>,
    accessToken = this.authService.getAccessToken()
  ): HttpRequest<unknown> {
    const headers: Record<string, string> = {};
    const tenant = this.configService.getCurrentTenantHeader();

    if (tenant) {
      headers['x-tenant'] = tenant;
    }

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    if (!request.headers.has('Content-Type') && !(request.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    return Object.keys(headers).length > 0
      ? request.clone({ setHeaders: headers })
      : request;
  }
}
