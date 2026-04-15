import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ApiService } from '../../../services/api.service';
import { ConfigService } from '../../../services/config.service';
import { Pagination } from '../../../models/pagination.model';
import { Proveedor } from '../../../models/inventario/proveedor.model';
import { CrearProveedorComponent } from './crear-proveedor/crear-proveedor';
import { EliminarProveedorComponent } from './eliminar-proveedor/eliminar-proveedor';

@Component({
  selector: 'app-proveedor',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './proveedor.html',
  styleUrls: ['./proveedor.scss']
})
export class ProveedorComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['id', 'nombre', 'direccion', 'telefono', 'acciones'];
  dataSource: Proveedor[] = [];
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  isLoading = false;

  private apiUrl: string;
  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private configService: ConfigService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    this.apiUrl = this.configService.getApiUrl('proveedores');
  }

  ngOnInit(): void {
    this.loadProveedores();
  }

  loadProveedores(): void {
    this.isLoading = true;
    this.apiService.getWithPagination<Proveedor>(
      this.apiUrl,
      this.currentPage + 1,
      this.pageSize
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: Pagination<Proveedor>) => {
          this.dataSource = data.results;
          this.totalItems = data.count;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error:', error);
          this.snackBar.open('Error al cargar los proveedores', 'Cerrar', { duration: 5000 });
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadProveedores();
  }

  crearProveedor(): void {
    const dialogRef = this.dialog.open(CrearProveedorComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: false
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.snackBar.open('Proveedor creado exitosamente', 'OK', { duration: 3000 });
          this.currentPage = 0;
          this.loadProveedores();
        }
      });
  }

  editarProveedor(proveedor: Proveedor): void {
    const dialogRef = this.dialog.open(CrearProveedorComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { proveedor }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.snackBar.open('Proveedor actualizado exitosamente', 'OK', { duration: 3000 });
          this.loadProveedores();
        }
      });
  }

  eliminarProveedor(proveedor: Proveedor): void {
    const dialogRef = this.dialog.open(EliminarProveedorComponent, {
      width: '500px',
      data: { proveedor }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.currentPage = 0;
          this.loadProveedores();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
