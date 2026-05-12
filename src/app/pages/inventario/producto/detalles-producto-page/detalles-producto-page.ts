import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';

import { ConfigService } from '../../../../services/config.service';
import { ApiService } from '../../../../services/api.service';
import { CartService } from '../../../../services/cart.service';
import { AuthService } from '../../../../services/auth.service';

import { Producto, Multimedia } from '../../../../models/inventario/producto.model';
import { VarianteProducto } from '../../../../models/inventario/variante.model';
import { Pagination } from '../../../../models/pagination.model';
import { CrearVarianteComponent } from '../../variante/crear-variante/crear-variante';
import { DetallesVarianteComponent } from '../../variante/detalles-variante/detalles-variante';
import { EliminarVarianteComponent } from '../../variante/eliminar-variante/eliminar-variante';

@Component({
  selector: 'app-detalles-producto-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule
  ],
  templateUrl: './detalles-producto-page.html',
  styleUrl: './detalles-producto-page.scss'
})
export class DetallesProductoPageComponent implements OnInit, OnDestroy {
  producto: Producto | null = null;
  variantes: VarianteProducto[] = [];
  isLoading = true;
  isLoadingVariantes = false;
  isSaving = false;

  archivoSeleccionado: File | null = null;
  previewUrl: string | null = null;

  private readonly columnasVarianteBase: string[] = ['sku', 'precio', 'cantidad', 'acciones'];
  private readonly columnasVarianteAdmin: string[] = ['costo_ponderado', 'limite_cantidad'];

  private productoId: number;
  private destroy$ = new Subject<void>();
  private multimediaUrl: string;
  private variantesUrl: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private apiService: ApiService,
    private configService: ConfigService,
    private snackBar: MatSnackBar,
    private cartService: CartService,
    private dialog: MatDialog,
    private authService: AuthService

  ) {
    this.productoId = Number(this.route.snapshot.paramMap.get('id'));
    this.multimediaUrl = this.configService.getApiUrl('multimedios');
    this.variantesUrl = this.configService.getApiUrl('variantes');
  }

  ngOnInit(): void {
    this.cargarProducto();
    this.cargarVariantes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarProducto(): void {
    this.isLoading = true;
    const url = this.configService.getApiUrl('productos');

    this.apiService.getById<Producto>(url, this.productoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (producto) => {
          this.producto = producto;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.snackBar.open('Error al cargar el producto', 'Cerrar', { duration: 5000 });
          this.router.navigate(['/inventario/productos']);
        }
      });
  }

  private cargarVariantes(): void {
    this.isLoadingVariantes = true;

    this.apiService.getWithPagination<VarianteProducto>(this.variantesUrl, 1, 100, { producto_id: this.productoId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.variantes = data.results;
          this.isLoadingVariantes = false;
        },
        error: () => {
          this.isLoadingVariantes = false;
        }
      });
  }

  volver(): void {
    this.router.navigate([this.isCliente ? '/extra/catalogo' : '/inventario/productos']);
  }

  get isCliente(): boolean {
    if (this.authService.isSuperuser()) {
      return false;
    }

    const roles = this.authService.getRoles();
    return roles.length === 1 && roles[0]?.toLowerCase() === 'cliente';
  }

  get displayedColumnsVariante(): string[] {
    if (this.isCliente) {
      return this.columnasVarianteBase;
    }

    return [...this.columnasVarianteBase, ...this.columnasVarianteAdmin];
  }

  getImagenPrincipalUrl(): string | null {
    if (!this.producto?.imagenes?.length) return null;
    const principal = this.producto.imagenes.find(i => i.es_principal);
    return principal ? principal.archivo_url : this.producto.imagenes[0].archivo_url;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        this.snackBar.open('Selecciona una imagen (JPEG, PNG, WebP)', 'Cerrar', { duration: 3000 });
        return;
      }
      this.archivoSeleccionado = file;
      this.previewUrl = URL.createObjectURL(file);
    }
  }

  agregarImagen(): void {
    if (!this.archivoSeleccionado || !this.producto) return;

    this.isSaving = true;
    const formData = new FormData();
    formData.append('archivo', this.archivoSeleccionado);
    formData.append('producto_id', String(this.producto.id));
    formData.append('tipo', 'imagen');

    const orden = this.producto.imagenes ? this.producto.imagenes.length : 0;
    formData.append('es_principal', String(orden === 0));
    formData.append('orden', String(orden));

    this.http.post(this.multimediaUrl, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.snackBar.open('Imagen subida exitosamente', 'OK', { duration: 3000 });
          this.archivoSeleccionado = null;
          this.previewUrl = null;
          this.cargarProducto();
        },
        error: () => {
          this.isSaving = false;
          this.snackBar.open('Error al subir la imagen', 'Cerrar', { duration: 3000 });
        }
      });
  }

  eliminarImagen(imagen: Multimedia): void {
    this.isSaving = true;
    this.http.delete(`${this.multimediaUrl}${imagen.id}/`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.snackBar.open('Imagen eliminada', 'OK', { duration: 3000 });
          this.cargarProducto();
        },
        error: () => {
          this.isSaving = false;
          this.snackBar.open('Error al eliminar imagen', 'Cerrar', { duration: 3000 });
        }
      });
  }

  establecerPrincipal(imagen: Multimedia): void {
    if (imagen.es_principal || !this.producto) return;

    this.isSaving = true;
    const updates = (this.producto.imagenes || []).map(img => {
      const isTarget = img.id === imagen.id;
      if (img.es_principal !== isTarget) {
        return this.http.patch(`${this.multimediaUrl}${img.id}/`, { es_principal: isTarget });
      }
      return null;
    });

    const firstUpdate = updates.find(u => u !== null);
    if (firstUpdate) {
      firstUpdate.pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.isSaving = false;
          this.snackBar.open('Imagen principal actualizada', 'OK', { duration: 3000 });
          this.cargarProducto();
        },
        error: () => {
          this.isSaving = false;
          this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 });
        }
      });
    } else {
      this.isSaving = false;
    }
  }

  cancelarSeleccion(): void {
    this.archivoSeleccionado = null;
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }
  }

  crearVariante(): void {
    const dialogRef = this.dialog.open(CrearVarianteComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { producto_id: this.productoId }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.snackBar.open('Variante creada exitosamente', 'OK', { duration: 3000 });
          this.cargarVariantes();
        }
      });
  }

  verVariante(variante: VarianteProducto): void {
    this.dialog.open(DetallesVarianteComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: { variante, ocultarCostos: this.isCliente }
    });
  }

  editarVariante(variante: VarianteProducto): void {
    const dialogRef = this.dialog.open(CrearVarianteComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { variante, producto_id: this.productoId }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.snackBar.open('Variante actualizada exitosamente', 'OK', { duration: 3000 });
          this.cargarVariantes();
        }
      });
  }

  eliminarVariante(variante: VarianteProducto): void {
    const dialogRef = this.dialog.open(EliminarVarianteComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: { variante }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.cargarVariantes();
        }
      });
  }
  
  agregarAlCarrito(variante: VarianteProducto): void {
    this.cartService.agregarProducto(variante.id, 1).subscribe({
      next: () => {
        this.snackBar.open('¡Producto añadido al carrito!', 'Ver Carrito', { 
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        }).onAction().subscribe(() => {
          this.router.navigate(['/extra/carrito']);
        });
      },
      error: (err) => {
        const msg = err.error?.error || 'No se pudo añadir al carrito';
        this.snackBar.open(msg, 'Cerrar', { duration: 3000 });
      }
    });
  }
}

