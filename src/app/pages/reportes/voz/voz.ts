import { Component, EventEmitter, Input, Output, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { VozService } from '../../../services/voz.service';
import { ReportesService } from '../../../services/reportes.service';
import { NLPRespuesta } from '../../../models/reportes/reporte-respuesta.model';

@Component({
  selector: 'app-voz',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="voz-container">
      <p class="voz-hint">Presiona el micrófono y di qué reporte necesitas.</p>
      <div class="voz-mic-area">
        <button
          mat-fab
          [class.listening]="escuchando"
          [class.disabled]="!soportado"
          (click)="toggleMic()"
          [disabled]="isLoading || !soportado"
          class="voz-button">
          <mat-icon *ngIf="!escuchando && !isLoading">mic</mat-icon>
          <mat-icon *ngIf="isLoading">hourglass_top</mat-icon>
          <mat-icon *ngIf="escuchando">mic_off</mat-icon>
        </button>
        <p *ngIf="escuchando" class="voz-status">Escuchando...</p>
        <p *ngIf="!soportado" class="voz-status error">Reconocimiento de voz no soportado en este navegador</p>
      </div>
      <div *ngIf="textoTranscrito" class="voz-texto">
        <p><strong>Texto:</strong> {{ textoTranscrito }}</p>
      </div>
      <div *ngIf="queryInterpretada" class="query-json">
        <h4>Query interpretada:</h4>
        <pre>{{ queryInterpretada | json }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .voz-container { padding: 16px 0; text-align: center; }
    .voz-hint { color: #666; margin-bottom: 24px; }
    .voz-mic-area { margin: 24px 0; }
    .voz-button { width: 80px; height: 80px; transition: all 0.3s; }
    .voz-button.listening { background-color: #f44336; transform: scale(1.1); box-shadow: 0 0 20px rgba(244,67,54,0.5); }
    .voz-button mat-icon { font-size: 36px; width: 36px; height: 36px; line-height: 36px; }
    .voz-status { margin-top: 12px; color: #666; font-style: italic; }
    .voz-status.error { color: #f44336; }
    .voz-texto { margin: 16px 0; padding: 12px; background: #e3f2fd; border-radius: 4px; }
    .query-json { background: #f5f5f5; border-radius: 4px; padding: 12px; text-align: left; }
    .query-json h4 { margin: 0 0 8px 0; font-size: 13px; color: #555; }
    .query-json pre { margin: 0; font-size: 12px; white-space: pre-wrap; max-height: 200px; overflow: auto; }
  `]
})
export class VozComponent implements OnDestroy {
  @Input() isLoading = false;
  @Output() ejecutar = new EventEmitter<NLPRespuesta>();

  soportado = false;
  escuchando = false;
  textoTranscrito = '';
  queryInterpretada: Record<string, any> | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private vozService: VozService,
    private reportesService: ReportesService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.soportado = this.vozService.isSupported();
  }

  ngOnInit(): void {
    this.vozService.resultado$
      .pipe(takeUntil(this.destroy$))
      .subscribe(texto => {
        this.escuchando = false;
        this.textoTranscrito = texto;
        this.cdr.markForCheck();
        this.ejecutarNLP(texto);
      });

    this.vozService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(err => {
        this.escuchando = false;
        this.snackBar.open(err, 'Cerrar', { duration: 5000 });
        this.cdr.markForCheck();
      });

    this.vozService.escuchando$
      .pipe(takeUntil(this.destroy$))
      .subscribe(estado => {
        this.escuchando = estado;
        this.cdr.markForCheck();
      });
  }

  toggleMic(): void {
    if (this.escuchando) {
      this.vozService.detener();
    } else {
      this.queryInterpretada = null;
      this.textoTranscrito = '';
      this.vozService.iniciar();
    }
  }

  private ejecutarNLP(texto: string): void {
    this.reportesService.ejecutarNLP({ texto })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.queryInterpretada = res.query_interpretada;
          this.ejecutar.emit(res);
          const total = res.resultados?.paginacion?.total_registros || 0;
          this.snackBar.open(`Reporte ejecutado: ${total} registros`, 'OK', { duration: 3000 });
          this.cdr.markForCheck();
        },
        error: (err) => {
          const msg = err.error?.error || err.error?.detail || 'Error al procesar voz';
          this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
          this.cdr.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    this.vozService.detener();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
