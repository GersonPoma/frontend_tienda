import { Component, Inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Multimedia } from '../../../../../models/inventario/producto.model';

interface LightboxData {
  images: Multimedia[];
  startIndex: number;
  title?: string;
  modelUrl?: string;
  posterUrl?: string;
}

@Component({
  selector: 'app-imagen-lightbox',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './imagen-lightbox.component.html',
  styleUrl: './imagen-lightbox.component.scss'
})
export class ImagenLightboxComponent {
  index = 0;
  modelError: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<ImagenLightboxComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LightboxData
  ) {
    const total = data.images?.length ?? 0;
    const safeIndex = total > 0 ? Math.max(0, Math.min(data.startIndex ?? 0, total - 1)) : 0;
    this.index = safeIndex;
  }

  get total(): number {
    return this.data.images?.length ?? 0;
  }

  get isModelView(): boolean {
    return !!this.data.modelUrl;
  }

  get imagenActualUrl(): string | null {
    return this.data.images?.[this.index]?.archivo_url || null;
  }

  siguiente(): void {
    if (this.total === 0) return;
    this.index = (this.index + 1) % this.total;
  }

  anterior(): void {
    if (this.total === 0) return;
    this.index = (this.index - 1 + this.total) % this.total;
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  onModelLoad(): void {
    this.modelError = null;
    console.log('Model-viewer loaded:', this.data.modelUrl);
  }

  onModelError(event: Event): void {
    const detail = (event as CustomEvent)?.detail;
    this.modelError = detail?.message || 'Error al cargar el modelo 3D';
    console.error('Model-viewer error:', detail || event);
  }
}
