import { Component, OnDestroy, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';

import { ConfigService } from '../../../../services/config.service';
import { Producto, Multimedia } from '../../../../models/inventario/producto.model';

@Component({
  selector: 'app-detalles-producto',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './detalles-producto.html',
  styleUrl: './detalles-producto.scss'
})
export class DetallesProductoComponent implements OnInit, OnDestroy {
  producto: Producto;
  imagenPrincipal: Multimedia | null = null;
  isLoading = false;
  isSaving = false;
  archivoSeleccionado: File | null = null;
  previewUrl: string | null = null;
  private destroy$ = new Subject<void>();
  private multimediaUrl: string;

  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<DetallesProductoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { producto: Producto }
  ) {
    this.producto = data.producto;
    this.multimediaUrl = this.configService.getApiUrl('multimedios');
    this.imagenPrincipal = this.producto.imagenes?.find(i => i.es_principal) || null;
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  getImagenPrincipalUrl(): string | null {
    if (this.imagenPrincipal) {
      return this.imagenPrincipal.archivo_url;
    }
    if (this.producto.imagenes && this.producto.imagenes.length > 0) {
      return this.producto.imagenes[0].archivo_url;
    }
    return null;
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
    if (!this.archivoSeleccionado) {
      this.snackBar.open('Selecciona una imagen', 'Cerrar', { duration: 3000 });
      return;
    }

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
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.isSaving = false;
          console.error('Error al subir imagen:', error);
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
          this.dialogRef.close(true);
        },
        error: () => {
          this.isSaving = false;
          this.snackBar.open('Error al eliminar imagen', 'Cerrar', { duration: 3000 });
        }
      });
  }

  establecerPrincipal(imagen: Multimedia): void {
    if (imagen.es_principal) return;

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
          this.dialogRef.close(true);
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
}