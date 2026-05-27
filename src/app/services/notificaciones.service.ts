import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CrearPromocionPayload,
  NotificacionPush,
  Promocion,
  SuscripcionPushPayload,
} from '../models/notificaciones.model';

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private readonly apiBaseUrl = '/api';
  private readonly tenant = 'tienda_amiga';

  constructor(private http: HttpClient) {}

  getPromociones(): Observable<Promocion[] | { results?: Promocion[]; count?: number }> {
    return this.http.get<Promocion[] | { results?: Promocion[]; count?: number }>(
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

  getVapidPublicKey(): Observable<string | Record<string, string>> {
    return this.http.get<string | Record<string, string>>(
      `${this.getApiUrl('notificaciones')}vapid-public-key/`,
      { headers: this.getHeaders() }
    );
  }

  private getApiUrl(endpoint: string): string {
    return `${this.apiBaseUrl}/${endpoint}/`;
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-Tenant': this.tenant,
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    });
  }
}
