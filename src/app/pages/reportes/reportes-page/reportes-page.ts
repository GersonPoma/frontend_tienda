import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { QbeBuilderComponent } from '../qbe-builder/qbe-builder';
import { TextoNLPComponent } from '../texto-nlp/texto-nlp';
import { VozComponent } from '../voz/voz';
import { ReporteResultadosComponent } from '../reporte-resultados/reporte-resultados';
import { ReporteExportComponent } from '../reporte-export/reporte-export';
import { ReporteRespuesta, NLPRespuesta } from '../../../models/reportes/reporte-respuesta.model';

@Component({
  selector: 'app-reportes-page',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatIconModule,
    QbeBuilderComponent,
    TextoNLPComponent,
    VozComponent,
    ReporteResultadosComponent,
    ReporteExportComponent,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <div class="page-header">
          <mat-card-title>Reportes</mat-card-title>
        </div>
      </mat-card-header>
      <mat-card-content>
        <mat-tab-group [selectedIndex]="tabIndex" (selectedTabChange)="onTabChange($event)">
          <mat-tab label="QBE">
            <ng-template matTabContent>
              <app-qbe-builder
                (ejecutarQBE)="onEjecutarQBE($event)"
                [isLoading]="isLoading">
              </app-qbe-builder>
            </ng-template>
          </mat-tab>
          <mat-tab label="Texto">
            <ng-template matTabContent>
              <app-texto-nlp
                (ejecutar)="onEjecutarNLP($event)"
                [isLoading]="isLoading">
              </app-texto-nlp>
            </ng-template>
          </mat-tab>
          <mat-tab label="Voz">
            <ng-template matTabContent>
              <app-voz
                (ejecutar)="onEjecutarNLP($event)"
                [isLoading]="isLoading">
              </app-voz>
            </ng-template>
          </mat-tab>
        </mat-tab-group>

        <div *ngIf="resultados || errorMsg" class="m-t-24">
          <app-reporte-resultados
            *ngIf="resultados"
            [resultados]="resultados"
            [queryInterpretada]="queryInterpretada">
          </app-reporte-resultados>

          <app-reporte-export
            *ngIf="resultados"
            [resultados]="resultados"
            [nombreReporte]="nombreReporte">
          </app-reporte-export>

          <div *ngIf="errorMsg" class="empty-state">
            <mat-icon class="empty-icon">error</mat-icon>
            <p class="empty-text">{{ errorMsg }}</p>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .m-t-24 { margin-top: 24px; }
  `]
})
export class ReportesPageComponent {
  tabIndex = 0;
  isLoading = false;
  resultados: ReporteRespuesta | null = null;
  queryInterpretada: Record<string, any> | null = null;
  errorMsg: string | null = null;
  nombreReporte = 'reporte';

  onTabChange(event: any): void {
    this.tabIndex = event.index;
    this.limpiarResultados();
  }

  onEjecutarQBE(payload: { resultados: ReporteRespuesta; nombre: string }): void {
    this.resultados = payload.resultados;
    this.queryInterpretada = null;
    this.errorMsg = null;
    this.nombreReporte = payload.nombre;
  }

  onEjecutarNLP(respuesta: NLPRespuesta): void {
    this.resultados = respuesta.resultados;
    this.queryInterpretada = respuesta.query_interpretada;
    this.errorMsg = null;
    this.nombreReporte = 'reporte-nlp';
  }



  limpiarResultados(): void {
    this.resultados = null;
    this.queryInterpretada = null;
    this.errorMsg = null;
  }
}
