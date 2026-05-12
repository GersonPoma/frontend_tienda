import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
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
import { Pagination } from 'src/app/models/pagination.model';
import { BitacoraAuditoria } from 'src/app/models/bitacora-auditoria.model'; 
import { ApiService } from 'src/app/services/api.service';
import { ConfigService } from 'src/app/services/config.service';

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
    'usuario',
    'accion',
    'modulo',
    'descripcion',
    'ip',
    'resultado',
  ];
  dataSource: BitacoraAuditoria[] = [];

  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  isLoading = false;

  private fb = inject(FormBuilder);

  filtrosForm = this.fb.group({
    search: [''],
    accion: [''],
    modulo: [''],
    fecha_inicio: [''],
    fecha_fin: [''],
  });

  acciones = [
    { value: 'CREATE', label: 'Creacion' },
    { value: 'UPDATE', label: 'Actualizacion' },
    { value: 'DELETE', label: 'Eliminacion' },
    { value: 'LOGIN', label: 'Inicio de sesion' },
    { value: 'LOGOUT', label: 'Cierre de sesion' },
  ];

  private apiUrl: string;
  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private configService: ConfigService,
    private snackBar: MatSnackBar
  ) {
    this.apiUrl = this.configService.getApiUrl('bitacora');
  }

  ngOnInit(): void {
    this.loadBitacora();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBitacora(): void {
    this.isLoading = true;

    this.apiService.getWithPagination<BitacoraAuditoria>(
      this.apiUrl,
      this.currentPage + 1,
      this.pageSize,
      this.getFiltros()
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const response = data as unknown;
          this.dataSource = this.getRegistros(response);
          this.totalItems = this.getTotalRegistros(response, this.dataSource.length);

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
      search: '',
      accion: '',
      modulo: '',
      fecha_inicio: '',
      fecha_fin: '',
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

  getModulo(registro: BitacoraAuditoria): string {
    const modulo = registro.modulo || registro.app_label || '';
    const modelo = registro.modelo || registro.model_name || '';

    if (modulo && modelo) {
      return `#${modulo} / ${modelo}`;
    }

    return modulo || modelo || 'General';
  }

  getDescripcion(registro: BitacoraAuditoria): string {
    return registro.descripcion || registro.detalle || registro.mensaje || registro.objeto || registro.object_repr || 'Sin descripcion';
  }

  getIp(registro: BitacoraAuditoria): string {
    return registro.ip || registro.ip_address || '-';
  }

  getFecha(registro: BitacoraAuditoria): string | null {
    return registro.fecha || registro.fecha_hora || registro.created_at || registro.timestamp || null;
  }

  getResultado(registro: BitacoraAuditoria): string {
    if (typeof registro.exitoso === 'boolean') {
      return registro.exitoso ? 'Exitoso' : 'Fallido';
    }

    return registro.resultado || 'Registrado';
  }

  getResultadoColor(registro: BitacoraAuditoria): 'primary' | 'warn' | 'accent' {
    const resultado = this.getResultado(registro).toLowerCase();

    if (resultado.includes('fall') || resultado.includes('error')) {
      return 'warn';
    }

    if (resultado.includes('registr')) {
      return 'accent';
    }

    return 'primary';
  }

  private getFiltros(): Record<string, string> {
    const raw = this.filtrosForm.getRawValue();
    const filtros: Record<string, string> = {};

    Object.entries(raw).forEach(([key, value]) => {
      if (value) {
        filtros[key] = value;
      }
    });

    return filtros;
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