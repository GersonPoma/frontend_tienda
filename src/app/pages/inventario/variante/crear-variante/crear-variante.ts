import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

import { ApiService } from '../../../../services/api.service';
import { ConfigService } from '../../../../services/config.service';

@Component({
  selector: 'app-crear-variante',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './crear-variante.html',
  styleUrl: './crear-variante.scss'
})
export class CrearVarianteComponent implements OnInit, OnDestroy {
  form: FormGroup;
  isSaving = false;
  isEditMode = false;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private configService: ConfigService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<CrearVarianteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEditMode = !!data?.variante;

    this.form = this.formBuilder.group({
      sku: [data?.variante?.sku || '', [Validators.required, Validators.maxLength(100)]],
      precio: [data?.variante?.precio || '', [Validators.required, Validators.min(0)]],
      cantidad: [data?.variante?.cantidad || 0, [Validators.required, Validators.min(0)]],
      costo_ponderado: [data?.variante?.costo_ponderado || '', [Validators.required, Validators.min(0)]],
      limite_cantidad: [data?.variante?.limite_cantidad || 0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  guardar(): void {
    if (this.form.invalid) {
      this.snackBar.open('Por favor completa todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isSaving = true;
    const formValues = this.form.value;
    const url = this.configService.getApiUrl('variantes');

    const varianteData = {
      sku: formValues.sku,
      precio: Number(formValues.precio),
      cantidad: Number(formValues.cantidad),
      costo_ponderado: Number(formValues.costo_ponderado),
      limite_cantidad: Number(formValues.limite_cantidad),
      producto_id: Number(this.data.producto_id)
    };

    if (this.isEditMode) {
      this.apiService.update(url, this.data.variante.id, varianteData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isSaving = false;
            this.snackBar.open('Variante actualizada exitosamente', 'OK', { duration: 3000 });
            this.dialogRef.close(true);
          },
          error: (err) => {
            this.isSaving = false;
            console.error('Error updating variante:', err);
            this.snackBar.open('Error al actualizar la variante', 'Cerrar', { duration: 5000 });
          }
        });
    } else {
      this.apiService.create(url, varianteData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isSaving = false;
            this.snackBar.open('Variante creada exitosamente', 'OK', { duration: 3000 });
            this.dialogRef.close(response);
          },
          error: (err) => {
            this.isSaving = false;
            console.error('Error creating variante:', err);
            this.snackBar.open('Error al crear la variante', 'Cerrar', { duration: 5000 });
          }
        });
    }
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
