import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { BitacoraAuditoria } from 'src/app/models/bitacora-auditoria.model'; 

@Component({
  selector: 'app-bitacora-auditoria',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './bitacora-auditoria.html',
  styleUrl: './bitacora-auditoria.scss',
})
export class BitacoraAuditoriaComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = [
    'fecha',
    'hora',
    'usuario',
    'accion',
    'entidad',
    'metodo',
    'ruta',
    'estado_http',
    'ip_cliente',
    'detalles',
  ];
  dataSource: BitacoraAuditoria[] = [];

  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  isLoading = false;

  private fb = inject(FormBuilder);

  filtrosForm = this.fb.group({
    accion: [''],
    metodo: [''],
  });

  acciones = [
    { value: 'CREATE', label: 'Creacion' },
    { value: 'UPDATE', label: 'Actualizacion' },
    { value: 'DELETE', label: 'Eliminacion' },
    { value: 'LOGIN', label: 'Inicio de sesion' },
    { value: 'LOGOUT', label: 'Cierre de sesion' },
  ];

  metodos = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  private readonly apiUrl = 'http://127.0.0.1:8000/api/bitacora/';
  private readonly tenant = 'tienda_amiga';
  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadBitacora();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBitacora(): void {
    this.isLoading = true;

    this.http.get<unknown>(this.apiUrl, {
      headers: new HttpHeaders({ 'X-Tenant': this.tenant }),
      params: this.getParams(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dataSource = this.getRegistros(data);
          this.totalItems = this.getTotalRegistros(data, this.dataSource.length);

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar bitacora de auditoria:', error);
          this.snackBar.open('Error al cargar la bitacora de auditoria', 'Cerrar', { duration: 5000 });
          this.isLoading = false;
        }
      });
  }

  consultar(): void {
    this.currentPage = 0;
    this.loadBitacora();
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({
      accion: '',
      metodo: '',
    });
    this.consultar();
  }

  actualizar(): void {
    this.loadBitacora();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadBitacora();
  }

  getUsuario(registro: BitacoraAuditoria): string {
    if (registro.usuarios_id) {
      return `Usuario #${registro.usuarios_id}`;
    }

    if (typeof registro.usuario === 'string') {
      return registro.usuario;
    }

    if (typeof registro.usuario === 'number') {
      return `Usuario #${registro.usuario}`;
    }

    if (registro.usuario) {
      return registro.usuario.nombre_completo || registro.usuario.username || registro.usuario.email || 'Usuario';
    }

    return registro.username || registro.usuario_username || 'Sistema';
  }

  getAccion(registro: BitacoraAuditoria): string {
    return registro.accion || registro.action || registro.metodo || 'Consulta';
  }

  getEntidad(registro: BitacoraAuditoria): string {
    const modulo = registro.modulo || registro.app_label || '';
    const modelo = registro.modelo || registro.model_name || '';

    if (registro.entidad) {
      return registro.entidad;
    }

    if (modulo && modelo) {
      return `${modulo} / ${modelo}`;
    }

    return modulo || modelo || 'General';
  }

  getDescripcion(registro: BitacoraAuditoria): string {
    return registro.detalles || registro.descripcion || registro.detalle || registro.mensaje || registro.objeto || registro.object_repr || 'Sin descripcion';
  }

  getIp(registro: BitacoraAuditoria): string {
    return registro.ip_cliente || registro.ip || registro.ip_address || '-';
  }

  getFecha(registro: BitacoraAuditoria): string | null {
    return registro.fecha || registro.fecha_hora || registro.created_at || registro.timestamp || null;
  }

  getHora(registro: BitacoraAuditoria): string {
    return registro.hora || '-';
  }

  getEstadoHttp(registro: BitacoraAuditoria): string {
    if (registro.estado_http === 0 || registro.estado_http) {
      return String(registro.estado_http);
    }

    if (typeof registro.exitoso === 'boolean') {
      return registro.exitoso ? '200' : '500';
    }

    return registro.resultado || '-';
  }

  getEstadoHttpColor(registro: BitacoraAuditoria): 'primary' | 'warn' | 'accent' {
    const estado = Number(this.getEstadoHttp(registro));

    if (estado >= 400) {
      return 'warn';
    }

    if (estado >= 300) {
      return 'accent';
    }

    return 'primary';
  }

  private getParams(): HttpParams {
    const raw = this.filtrosForm.getRawValue();
    let params = new HttpParams()
      .set('page', String(this.currentPage + 1))
      .set('page_size', String(this.pageSize));

    Object.entries(raw).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });

    return params;
  }

  private getRegistros(response: unknown): BitacoraAuditoria[] {
    if (Array.isArray(response)) {
      return response as BitacoraAuditoria[];
    }

    if (this.isObjectResponse(response)) {
      const results = response['results'];
      const data = response['data'];
      const registros = response['registros'];

      if (Array.isArray(results)) {
        return results as BitacoraAuditoria[];
      }

      if (Array.isArray(data)) {
        return data as BitacoraAuditoria[];
      }

      if (Array.isArray(registros)) {
        return registros as BitacoraAuditoria[];
      }
    }

    return [];
  }

  private getTotalRegistros(response: unknown, fallback: number): number {
    if (this.isObjectResponse(response)) {
      const total = response['count'] ?? response['total'] ?? response['totalItems'];

      if (typeof total === 'number') {
        return total;
      }
    }

    return fallback;
  }

  private isObjectResponse(response: unknown): response is Record<string, unknown> {
    return typeof response === 'object' && response !== null;
  }
}
