import { Component, OnInit, OnDestroy, Inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil } from 'rxjs';

import { ApiService } from '../../../../services/api.service';
import { ConfigService } from '../../../../services/config.service';
import { Categoria } from '../../../../models/inventario/categoria.model';
import { Producto, CrearMultimedia } from '../../../../models/inventario/producto.model';
import { Pagination } from '../../../../models/pagination.model';

@Component({
  selector: 'app-crear-producto',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
    MatSelectModule
  ],
  templateUrl: './crear-producto.html',
  styleUrl: './crear-producto.scss'
})
export class CrearProductoComponent implements OnInit, OnDestroy {
  form: FormGroup;
  categorias: Categoria[] = [];
  isSaving = false;
  isEditMode = false;
  isLoadingCategorias = false;
  
  private destroy$ = new Subject<void>();
  private multimediaUrl: string;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private configService: ConfigService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<CrearProductoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEditMode = !!data?.producto;
    this.multimediaUrl = this.configService.getApiUrl('multimedios');
    
    this.form = this.formBuilder.group({
      codigo: [data?.producto?.codigo || '', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      nombre: [data?.producto?.nombre || '', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      precio: [data?.producto?.precio || '', [Validators.required, Validators.min(0)]],
      categoria_id: [data?.producto?.categoria || '', Validators.required],
      imagen_principal: [data?.producto?.imagenes?.find((i: any) => i.es_principal)?.id || null]
    });
  }

  ngOnInit(): void {
    this.cargarCategorias();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarCategorias(): void {
    this.isLoadingCategorias = true;
    const url = this.configService.getApiUrl('categorias');

    this.apiService.getWithPagination<Categoria>(url, 1, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: Pagination<Categoria>) => {
          this.categorias = data.results;
          this.isLoadingCategorias = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.isLoadingCategorias = false;
          this.snackBar.open('Error al cargar categorías', 'Cerrar', { duration: 5000 });
        }
      });
  }

  guardar(): void {
    console.log('Guardar clicked - isEditMode:', this.isEditMode, 'form.valid:', this.form.valid);
    
    if (this.form.invalid) {
      this.snackBar.open('Por favor completa todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isSaving = true;
    const formValues = this.form.value;
    const url = this.configService.getApiUrl('productos');
    console.log('URL:', url, 'producto id:', this.data.producto?.id);
    
    const productoData = {
      codigo: formValues.codigo,
      nombre: formValues.nombre,
      precio: Number(formValues.precio),
      categoria_id: Number(formValues.categoria_id)
    };

    if (this.isEditMode) {
      console.log('Updating producto:', this.data.producto.id);
      this.apiService.update(url, this.data.producto.id, productoData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            console.log('Update response:', response);
            this.isSaving = false;
            this.snackBar.open('Producto actualizado exitosamente', 'OK', { duration: 3000 });
            this.dialogRef.close(true);
          },
          error: (err) => {
            this.isSaving = false;
            console.error('Error updating:', err);
            this.snackBar.open('Error al actualizar el producto', 'Cerrar', { duration: 5000 });
          }
        });
    } else {
      console.log('Creating producto');
      this.apiService.create(url, productoData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            console.log('Create response:', response);
            this.isSaving = false;
            this.snackBar.open('Producto creado exitosamente', 'OK', { duration: 3000 });
            this.dialogRef.close(response);
          },
          error: (err) => {
            this.isSaving = false;
            console.error('Error creating:', err);
            this.snackBar.open('Error al crear el producto', 'Cerrar', { duration: 5000 });
          }
        });
    }
  }

private actualizarImagenPrincipal(productoId: number, imagenId: number | null): void {
    if (!imagenId) {
      this.dialogRef.close(true);
      return;
    }

    this.isSaving = true;
    this.apiService.getAll<any>(this.multimediaUrl, { producto_id: productoId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (imagenes: any[]) => {
          if (imagenes.length === 0) {
            this.isSaving = false;
            this.dialogRef.close(true);
            return;
          }

          let updatesCompleted = 0;
          const imagesToUpdate = imagenes.filter(img => img.es_principal !== (img.id === imagenId));
          const totalUpdates = imagesToUpdate.length;

          if (totalUpdates === 0) {
            this.isSaving = false;
            this.snackBar.open('Producto actualizado', 'OK', { duration: 3000 });
            this.dialogRef.close(true);
            return;
          }

          imagesToUpdate.forEach(img => {
            this.apiService.patch(this.multimediaUrl, img.id, { es_principal: img.id === imagenId })
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => {
                  updatesCompleted++;
                  if (updatesCompleted >= totalUpdates) {
                    this.isSaving = false;
                    this.snackBar.open('Producto actualizado', 'OK', { duration: 3000 });
                    this.dialogRef.close(true);
                  }
                },
                error: () => {
                  updatesCompleted++;
                  if (updatesCompleted >= totalUpdates) {
                    this.isSaving = false;
                    this.dialogRef.close(true);
                  }
                }
              });
          });
        },
        error: () => {
          this.isSaving = false;
          this.snackBar.open('Producto actualizado', 'OK', { duration: 3000 });
          this.dialogRef.close(true);
        }
      });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}