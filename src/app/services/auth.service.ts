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
  is_superuser: boolean;
  roles: string[];
  permisos: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  usuario_id: number | null;
  username: string | null;
  nombre_completo: string | null;
  access_token: string | null;
  refresh_token: string | null;
  is_superuser: boolean;
  roles: string[];
  permisos: string[];
}

const ACCESS_KEY = 'access';
const REFRESH_KEY = 'refresh';
const USERNAME_KEY = 'username';
const TENANT_SCHEMA_KEY = 'tenant_schema';

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
    const tenantSchema = this.configService.getCurrentTenantHeader();

    if (tenantSchema) {
      localStorage.setItem(TENANT_SCHEMA_KEY, tenantSchema);
    }

    localStorage.setItem(ACCESS_KEY, response.access);
    localStorage.setItem(REFRESH_KEY, response.refresh);
    localStorage.setItem(USERNAME_KEY, response.username);
    localStorage.setItem(this.getStorageKey('access_token'), response.access);
    localStorage.setItem(this.getStorageKey('refresh_token'), response.refresh);
    localStorage.setItem(this.getStorageKey('usuario_id'), response.usuario_id.toString());
    localStorage.setItem(this.getStorageKey('username'), response.username);
    localStorage.setItem(this.getStorageKey('nombre_completo'), response.nombre_completo);
    localStorage.setItem(this.getStorageKey('is_superuser'), JSON.stringify(response.is_superuser));
    localStorage.setItem(this.getStorageKey('roles'), JSON.stringify(response.roles));
    localStorage.setItem(this.getStorageKey('permisos'), JSON.stringify(response.permisos));

    this.authState.next({
      isAuthenticated: true,
      usuario_id: response.usuario_id,
      username: response.username,
      nombre_completo: response.nombre_completo,
      access_token: response.access,
      refresh_token: response.refresh,
      is_superuser: response.is_superuser,
      roles: response.roles,
      permisos: response.permisos
    });
  }

  /**
   * Restaurar estado de autenticación desde localStorage
   */
  private restoreAuthState(): void {
    this.clearFlatAuthDataIfTenantChanged();

    const accessToken = localStorage.getItem(ACCESS_KEY) || localStorage.getItem(this.getStorageKey('access_token'));
    const refreshToken = localStorage.getItem(REFRESH_KEY) || localStorage.getItem(this.getStorageKey('refresh_token'));
    const usuarioId = localStorage.getItem(this.getStorageKey('usuario_id'));
    const username = localStorage.getItem(USERNAME_KEY) || localStorage.getItem(this.getStorageKey('username'));
    const nombreCompleto = localStorage.getItem(this.getStorageKey('nombre_completo'));
    const isSuperuser = localStorage.getItem(this.getStorageKey('is_superuser'));
    const roles = localStorage.getItem(this.getStorageKey('roles'));
    const permisos = localStorage.getItem(this.getStorageKey('permisos'));

    if (accessToken && usuarioId) {
      this.authState.next({
        isAuthenticated: true,
        usuario_id: parseInt(usuarioId),
        username: username || null,
        nombre_completo: nombreCompleto || null,
        access_token: accessToken,
        refresh_token: refreshToken,
        is_superuser: isSuperuser ? JSON.parse(isSuperuser) : false,
        roles: roles ? JSON.parse(roles) : [],
        permisos: permisos ? JSON.parse(permisos) : []
      });
    }
  }

  /**
   * Limpiar datos de autenticación
   */
  private clearAuthData(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(TENANT_SCHEMA_KEY);
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(this.getStorageKey('access_token'));
    localStorage.removeItem(this.getStorageKey('refresh_token'));
    localStorage.removeItem(this.getStorageKey('usuario_id'));
    localStorage.removeItem(this.getStorageKey('username'));
    localStorage.removeItem(this.getStorageKey('nombre_completo'));
    localStorage.removeItem(this.getStorageKey('is_superuser'));
    localStorage.removeItem(this.getStorageKey('roles'));
    localStorage.removeItem(this.getStorageKey('permisos'));
  }

  /**
   * Obtener token de acceso
   */
  getAccessToken(): string | null {
    this.clearFlatAuthDataIfTenantChanged();
    return localStorage.getItem(ACCESS_KEY) || localStorage.getItem(this.getStorageKey('access_token'));
  }

  /**
   * Obtener token de refresco
   */
  getRefreshToken(): string | null {
    this.clearFlatAuthDataIfTenantChanged();
    return localStorage.getItem(REFRESH_KEY) || localStorage.getItem(this.getStorageKey('refresh_token'));
  }

  /**
   * Obtener ID del usuario
   */
  getUsuarioId(): number | null {
    const id = localStorage.getItem(this.getStorageKey('usuario_id'));
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
          localStorage.setItem(ACCESS_KEY, response.access);
          localStorage.setItem(REFRESH_KEY, response.refresh);
          localStorage.setItem(this.getStorageKey('access_token'), response.access);
          localStorage.setItem(this.getStorageKey('refresh_token'), response.refresh);
        }
      })
    );
  }

  /**
   * Obtener lista de permisos del usuario
   */
  getPermisos(): string[] {
    return this.authState.value.permisos;
  }

  /**
   * Verificar si tiene un permiso específico
   */
  hasPermiso(permiso: string): boolean {
    const permisos = this.getPermisos();
    return permisos.includes('*') || permisos.includes(permiso);
  }

  /**
   * Verificar si tiene alguno de los permisos especificados
   */
  hasAnyPermiso(permisos: string[]): boolean {
    return permisos.some(p => this.hasPermiso(p));
  }

  /**
   * Verificar si es superusuario
   */
  isSuperuser(): boolean {
    return this.authState.value.is_superuser;
  }

  /**
   * Obtener lista de roles del usuario
   */
  getRoles(): string[] {
    return this.authState.value.roles;
  }

  /**
   * Verificar si tiene un rol específico
   */
  hasRol(rol: string): boolean {
    return this.authState.value.roles.includes(rol);
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
      refresh_token: null,
      is_superuser: false,
      roles: [],
      permisos: []
    };
  }

  private getStorageKey(key: string): string {
    const tenant = this.configService.getCurrentTenantStorageKey();
    return `${this.STORAGE_PREFIX}${tenant}_${key}`;
  }

  private clearFlatAuthDataIfTenantChanged(): void {
    const currentTenant = this.configService.getCurrentTenantHeader();
    const storedTenant = localStorage.getItem(TENANT_SCHEMA_KEY);

    if (currentTenant && storedTenant !== currentTenant) {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(TENANT_SCHEMA_KEY);
      localStorage.removeItem(USERNAME_KEY);
    }
  }
}
