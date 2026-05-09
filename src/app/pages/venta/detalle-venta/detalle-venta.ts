import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

import { ApiService } from '../../../services/api.service';
import { ConfigService } from '../../../services/config.service';
import { PermisosService } from '../../../services/permisos.service';
import { Venta } from '../../../models/venta/venta.model';
import { DetalleVenta, ActualizarDetalleVenta, ActualizarVenta } from '../../../models/venta/detalle-venta.model';

@Component({
  selector: 'app-detalle-venta',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatInputModule,
  ],
  templateUrl: './detalle-venta.html',
})
export class DetalleVentaComponent implements OnInit, OnDestroy {
  venta: Venta | null = null;
  isLoading = false;
  isSaving = false;

  estados = ['pendiente', 'completado', 'cancelado'];
  estadoEditado: string = '';

  detallesEditados: { [id: number]: number | undefined } = {};

  puedeEditar = false;
  puedeEliminar = false;

  displayedColumns: string[] = ['producto', 'cantidad', 'precio_unitario', 'subtotal', 'acciones'];

  private apiUrl: string;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private configService: ConfigService,
    private permisosService: PermisosService,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {
    this.apiUrl = this.configService.getApiUrl('ventas');
  }

  ngOnInit(): void {
    this.puedeEditar = this.permisosService.puedeEditarVenta();
    this.puedeEliminar = this.permisosService.puedeEliminarVenta();

    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          const id = params.get('id');
          if (!id) throw new Error('ID no proporcionado');
          this.isLoading = true;
          return this.apiService.getById<Venta>(this.apiUrl, id);
        })
      )
      .subscribe({
        next: (venta) => {
          this.venta = venta;
          this.estadoEditado = venta.estado;
          if (venta.detalles) {
            venta.detalles.forEach(d => {
              this.detallesEditados[d.id] = d.cantidad;
            });
          }
          this.isLoading = false;
        },
        error: () => {
          this.snackBar.open('Error al cargar la venta', 'Cerrar', { duration: 5000 });
          this.isLoading = false;
          this.router.navigate(['/ventas']);
        }
      });
  }

  get detallesConCambios(): boolean {
    if (!this.venta?.detalles) return false;
    return this.venta.detalles.some(d => this.detallesEditados[d.id] !== d.cantidad);
  }

  get totalCalculado(): number {
    if (!this.venta?.detalles) return 0;
    return this.venta.detalles.reduce((sum, d) => {
      const cant = this.detallesEditados[d.id] ?? d.cantidad;
      return sum + cant * Number(d.precio_unitario);
    }, 0);
  }

  guardarCambios(): void {
    if (!this.venta) return;
    this.isSaving = true;

    const detallesPayload: ActualizarDetalleVenta[] = [];

    if (this.venta.detalles) {
      for (const d of this.venta.detalles) {
        const nuevaCant = this.detallesEditados[d.id];
        if (nuevaCant !== undefined && nuevaCant !== d.cantidad) {
          detallesPayload.push({
            id: d.id,
            variante_producto_id: d.variante_producto,
            cantidad: nuevaCant,
            precio_unitario: Number(d.precio_unitario),
          });
        }
      }
    }

    const soloEstado = this.estadoEditado !== this.venta.estado && detallesPayload.length === 0;

    if (soloEstado) {
      this.apiService.patch<Venta>(this.apiUrl, this.venta.id, { estado: this.estadoEditado })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Estado actualizado', 'OK', { duration: 3000 });
            this.isSaving = false;
            this.recargar();
          },
          error: (err) => {
            const msg = err.error?.detail || 'Error al actualizar';
            this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
            this.isSaving = false;
          }
        });
      return;
    }

    const payload: ActualizarVenta = {
      estado: this.estadoEditado,
      detalles: detallesPayload,
      precio_total: this.totalCalculado,
    };

    this.apiService.update<Venta>(this.apiUrl, this.venta.id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Venta actualizada exitosamente', 'OK', { duration: 3000 });
          this.isSaving = false;
          this.recargar();
        },
        error: (err) => {
          const msg = err.error?.detail || err.error?.[0] || 'Error al actualizar';
          this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
          this.isSaving = false;
        }
      });
  }

  eliminarDetalle(detalle: DetalleVenta): void {
    if (!this.venta || !this.puedeEditar) return;

    const otrosDetalles = (this.venta.detalles || []).filter(d => d.id !== detalle.id);

    const payload: ActualizarVenta = {
      estado: this.estadoEditado,
      detalles: otrosDetalles.map(d => ({
        id: d.id,
        variante_producto_id: d.variante_producto,
        cantidad: d.cantidad,
        precio_unitario: Number(d.precio_unitario),
      })),
      precio_total: otrosDetalles.reduce(
        (sum, d) => sum + d.cantidad * Number(d.precio_unitario), 0
      ),
    };

    this.isSaving = true;
    this.apiService.update<Venta>(this.apiUrl, this.venta.id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Producto eliminado de la venta', 'OK', { duration: 3000 });
          this.isSaving = false;
          this.recargar();
        },
        error: (err) => {
          const msg = err.error?.detail || 'Error al eliminar';
          this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
          this.isSaving = false;
        }
      });
  }

  private recargar(): void {
    if (!this.venta) return;
    this.apiService.getById<Venta>(this.apiUrl, this.venta.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (venta) => {
          this.venta = venta;
          this.estadoEditado = venta.estado;
          this.detallesEditados = {};
          if (venta.detalles) {
            venta.detalles.forEach(d => {
              this.detallesEditados[d.id] = d.cantidad;
            });
          }
        }
      });
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'completado': return 'badge bg-success';
      case 'pendiente': return 'badge bg-warning';
      case 'cancelado': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  volver(): void {
    this.router.navigate(['/ventas']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
