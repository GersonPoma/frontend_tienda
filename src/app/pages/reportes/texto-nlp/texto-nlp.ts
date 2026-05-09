import { Component, EventEmitter, Input, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ReportesService } from '../../../services/reportes.service';
import { NLPRespuesta } from '../../../models/reportes/reporte-respuesta.model';

@Component({
  selector: 'app-texto-nlp',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="nlp-container">
      <p class="nlp-hint">Escribe en lenguaje natural qué reporte deseas ver.</p>
      <div class="nlp-input-row">
        <mat-form-field appearance="outline" class="nlp-input">
          <mat-label>Ej: los 10 productos más vendidos de mayo</mat-label>
          <textarea matInput [(ngModel)]="texto" rows="3" placeholder="Describe el reporte que necesitas..."></textarea>
        </mat-form-field>
      </div>
      <div class="nlp-actions">
        <button mat-raised-button color="primary" (click)="enviar()" [disabled]="procesando || !texto.trim()">
          <mat-spinner *ngIf="procesando" diameter="18" style="display:inline-block;margin-right:8px;"></mat-spinner>
          <mat-icon *ngIf="!procesando">auto_awesome</mat-icon>
          {{ procesando ? 'Interpretando...' : 'Interpretar y Ejecutar' }}
        </button>
      </div>
      <div *ngIf="queryInterpretada" class="query-json">
        <h4>Query interpretada:</h4>
        <pre>{{ queryInterpretada | json }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .nlp-container { padding: 16px 0; }
    .nlp-hint { color: #666; margin-bottom: 12px; }
    .nlp-input-row { margin-bottom: 12px; }
    .nlp-input { width: 100%; }
    .nlp-actions { margin-bottom: 16px; }
    .query-json { background: #f5f5f5; border-radius: 4px; padding: 12px; }
    .query-json h4 { margin: 0 0 8px 0; font-size: 13px; color: #555; }
    .query-json pre { margin: 0; font-size: 12px; white-space: pre-wrap; max-height: 200px; overflow: auto; }
  `]
})
export class TextoNLPComponent implements OnDestroy {
  @Input() isLoading = false;
  @Output() ejecutar = new EventEmitter<NLPRespuesta>();

  texto = '';
  procesando = false;
  queryInterpretada: Record<string, any> | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private reportesService: ReportesService,
    private snackBar: MatSnackBar
  ) {}

  enviar(): void {
    if (!this.texto.trim() || this.procesando) return;

    this.queryInterpretada = null;
    this.procesando = true;

    this.reportesService.ejecutarNLP({ texto: this.texto })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.procesando = false)
      )
      .subscribe({
        next: (res) => {
          this.queryInterpretada = res.query_interpretada;
          this.ejecutar.emit(res);
          const total = res.resultados?.paginacion?.total_registros || 0;
          this.snackBar.open(`Reporte ejecutado: ${total} registros`, 'OK', { duration: 3000 });
        },
        error: (err) => {
          const msg = err.error?.error || err.error?.detail || 'Error al procesar el texto';
          this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
