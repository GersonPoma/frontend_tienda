import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ConfigService } from './config.service';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  access: string;
  refresh: string;
  usuario_id: number;
  username: string;
  nombre_completo: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  usuario_id: number | null;
  username: string | null;
  nombre_completo: string | null;
  access_token: string | null;
  refresh_token: string | null;
}

/**
 * Servicio de Autenticación
 * Maneja login, logout, tokens y estado de la sesión
 * Guarda: access_token, refresh_token y usuario_id
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_PREFIX = 'auth_';
  private readonly ACCESS_TOKEN_KEY = `${this.STORAGE_PREFIX}access_token`;
  private readonly REFRESH_TOKEN_KEY = `${this.STORAGE_PREFIX}refresh_token`;
  private readonly USUARIO_ID_KEY = `${this.STORAGE_PREFIX}usuario_id`;
  private readonly USERNAME_KEY = `${this.STORAGE_PREFIX}username`;

  private authState = new BehaviorSubject<AuthState>(this.getInitialState());
  public authState$ = this.authState.asObservable();

  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private router: Router
  ) {
    this.restoreAuthState();
  }

  /**
   * Login con usuario y contraseña
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    const url = this.configService.getApiUrl('login');
    
    return this.http.post<LoginResponse>(url, credentials).pipe(
      tap(response => {
        if (response.success) {
          this.saveAuthData(response);
        }
      })
    );
  }

  /**
   * Logout - limpia los tokens y estado
   */
  logout(): Observable<void> {
    this.clearAuthData();
    this.authState.next(this.getInitialState());
    return of(void 0);
  }

  /**
   * Guardar datos de autenticación en localStorage
   */
  private saveAuthData(response: LoginResponse): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, response.access);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refresh);
    localStorage.setItem(this.USUARIO_ID_KEY, response.usuario_id.toString());
    localStorage.setItem(this.USERNAME_KEY, response.username);

    this.authState.next({
      isAuthenticated: true,
      usuario_id: response.usuario_id,
      username: response.username,
      nombre_completo: response.nombre_completo,
      access_token: response.access,
      refresh_token: response.refresh
    });
  }

  /**
   * Restaurar estado de autenticación desde localStorage
   */
  private restoreAuthState(): void {
    const accessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    const usuarioId = localStorage.getItem(this.USUARIO_ID_KEY);
    const username = localStorage.getItem(this.USERNAME_KEY);

    if (accessToken && usuarioId) {
      this.authState.next({
        isAuthenticated: true,
        usuario_id: parseInt(usuarioId),
        username: username || null,
        nombre_completo: null,
        access_token: accessToken,
        refresh_token: refreshToken
      });
    }
  }

  /**
   * Limpiar datos de autenticación
   */
  private clearAuthData(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USUARIO_ID_KEY);
    localStorage.removeItem(this.USERNAME_KEY);
  }

  /**
   * Obtener token de acceso
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Obtener token de refresco
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Obtener ID del usuario
   */
  getUsuarioId(): number | null {
    const id = localStorage.getItem(this.USUARIO_ID_KEY);
    return id ? parseInt(id) : null;
  }

  /**
   * Verificar si está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Obtener estado actual de autenticación
   */
  getCurrentAuthState(): AuthState {
    return this.authState.value;
  }

  /**
   * Obtener usuario actual como Observable
   */
  getCurrentUser(): Observable<{ username: string; nombre_completo: string }> {
    const currentState = this.authState.value;
    return of({
      username: currentState.username || '',
      nombre_completo: currentState.nombre_completo || ''
    });
  }

  /**
   * Refrescar token de acceso usando el refresh token
   */
  refreshAccessToken(): Observable<LoginResponse> {
    const url = this.configService.getApiUrl('auth/refresh');
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.logout();
      throw new Error('No refresh token available');
    }

    return this.http.post<LoginResponse>(url, { refresh: refreshToken }).pipe(
      tap(response => {
        if (response.success) {
          localStorage.setItem(this.ACCESS_TOKEN_KEY, response.access);
          localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refresh);
        }
      })
    );
  }

  /**
   * Estado inicial de autenticación
   */
  private getInitialState(): AuthState {
    return {
      isAuthenticated: false,
      usuario_id: null,
      username: null,
      nombre_completo: null,
      access_token: null,
      refresh_token: null
    };
  }
}
