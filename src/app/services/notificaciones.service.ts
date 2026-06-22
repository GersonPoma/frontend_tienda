import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { Producto } from '../models/inventario/producto.model';
import { Pagination } from '../models/pagination.model';
import {
  CrearPromocionPayload,
  NotificacionPush,
  PruebaNotificacionPayload,
  Promocion,
  SuscripcionPushPayload,
} from '../models/notificaciones.model';

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  getPromociones(): Observable<Pagination<Promocion>> {
    return this.http.get<Pagination<Promocion>>(
      this.getApiUrl('promociones'),
      { headers: this.getHeaders() }
    );
  }

  crearPromocion(payload: CrearPromocionPayload): Observable<Promocion> {
    return this.http.post<Promocion>(
      this.getApiUrl('promociones'),
      payload,
      { headers: this.getHeaders() }
    );
  }

  publicarPromocion(id: number | string): Observable<Promocion> {
    return this.http.post<Promocion>(
      `${this.getApiUrl('promociones')}${id}/publicar/`,
      {},
      { headers: this.getHeaders() }
    );
  }

  getNotificaciones(): Observable<NotificacionPush[] | { results?: NotificacionPush[]; count?: number }> {
    return this.http.get<NotificacionPush[] | { results?: NotificacionPush[]; count?: number }>(
      this.getApiUrl('notificaciones'),
      { headers: this.getHeaders() }
    );
  }

  suscribirse(payload: SuscripcionPushPayload): Observable<NotificacionPush> {
    return this.http.post<NotificacionPush>(
      `${this.getApiUrl('notificaciones')}suscribirse/`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  desuscribirse(endpoint: string): Observable<unknown> {
    return this.http.post(
      `${this.getApiUrl('notificaciones')}desuscribirse/`,
      { endpoint },
      { headers: this.getHeaders() }
    );
  }

  getProductos(): Observable<Producto[] | { results?: Producto[]; count?: number }> {
    const params = new HttpParams()
      .set('page', '1')
      .set('page_size', '1000');

    return this.http.get<Producto[] | { results?: Producto[]; count?: number }>(
      this.getApiUrl('productos'),
      { headers: this.getHeaders(), params }
    );
  }

  async getVapidPublicKey(): Promise<Record<string, unknown>> {
    const tenant = this.configService.getCurrentTenantHeader();
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (tenant) {
      headers['x-tenant'] = tenant;
    }

    try {
      return await this.fetchVapidResponse('vapid-public-key/', headers);
    } catch (error) {
      console.warn('No se pudo obtener VAPID con vapid-public-key, probando vapid_public_key:', error);
      return this.fetchVapidResponse('vapid_public_key/', headers);
    }
  }

  probar(payload: PruebaNotificacionPayload): Observable<unknown> {
    return this.http.post(
      `${this.getApiUrl('notificaciones')}probar/`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  private getApiUrl(endpoint: string): string {
    return this.configService.getApiUrl(endpoint);
  }

  private getPublicNotificacionesUrl(path: string): string {
    const tenant = this.configService.getCurrentTenantHeader();
    const apiBaseUrl = this.configService.getApiBaseUrl();

    if (!tenant) {
      return `${apiBaseUrl}/notificaciones/${path}`;
    }

    const url = new URL(`${apiBaseUrl}/notificaciones/${path}`);
    const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

    if (isLocalhost) {
      url.hostname = `${tenant.replace(/_/g, '-')}.localhost`;
    }

    return url.toString();
  }

  private async fetchVapidResponse(path: string, headers: Record<string, string>): Promise<Record<string, unknown>> {
    const url = this.getPublicNotificacionesUrl(path);
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const rawBody = await response.text();
    console.log('Respuesta VAPID raw:', {
      url,
      status: response.status,
      body: rawBody,
    });

    if (!response.ok) {
      throw new Error(`No se pudo obtener VAPID (${response.status})`);
    }

    try {
      return JSON.parse(rawBody);
    } catch {
      throw new Error('La respuesta VAPID no es JSON valido');
    }
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    });
  }
}
