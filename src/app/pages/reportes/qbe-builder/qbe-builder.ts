import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ReportesService } from '../../../services/reportes.service';
import { VistaLogica, CampoVista } from '../../../models/reportes/vista-logica.model';
import { QbePayload } from '../../../models/reportes/reporte-qbe.model';
import { ReporteRespuesta } from '../../../models/reportes/reporte-respuesta.model';

@Component({
  selector: 'app-qbe-builder',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule,
    MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatDividerModule,
  ],
  template: `
    <div class="qbe-container">
      <div *ngIf="!vistas.length" class="empty-state">
        <mat-spinner diameter="30"></mat-spinner>
        <p class="empty-text">Cargando vistas disponibles...</p>
      </div>

      <div *ngIf="vistas.length" class="ganancias-panel">
        <h3>Ganancias del Mes</h3>
        <div class="ganancias-row">
          <mat-form-field appearance="outline">
            <mat-label>Mes</mat-label>
            <mat-select [(ngModel)]="gananciasMes">
              <mat-option *ngFor="let m of meses" [value]="m.valor">{{ m.label }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Agrupar por</mat-label>
            <mat-select [(ngModel)]="gananciasGroupBy">
              <mat-option *ngFor="let g of groupByOptions" [value]="g.valor">{{ g.label }}</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-raised-button color="accent" (click)="generarGanancias()" [disabled]="gananciasCargando">
            <mat-spinner *ngIf="gananciasCargando" diameter="18" style="display:inline-block;margin-right:8px;"></mat-spinner>
            <mat-icon *ngIf="!gananciasCargando">trending_up</mat-icon>
            Generar
          </button>
        </div>
      </div>

      <mat-divider *ngIf="vistas.length" class="m-y-16"></mat-divider>

      <form *ngIf="vistas.length" [formGroup]="form" class="qbe-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Vista Lógica</mat-label>
          <mat-select formControlName="vista_logica" (selectionChange)="onVistaChange()">
            <mat-option *ngFor="let v of vistas" [value]="v.nombre">
              {{ v.etiqueta }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <div *ngIf="vistaSeleccionada" class="qbe-section">
          <h3>Filtros</h3>
          <div formArrayName="filtros">
            <div *ngFor="let f of filtros.controls; let i = index" [formGroupName]="i" class="filtro-row">
              <mat-form-field appearance="outline">
                <mat-label>Campo</mat-label>
                <mat-select formControlName="campo">
                  <mat-option *ngFor="let c of camposDisponibles" [value]="c.nombre">{{ c.etiqueta }}</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Operador</mat-label>
                <mat-select formControlName="operador">
                  <mat-option *ngFor="let op of getOperadoresParaFiltro(f)" [value]="op">{{ traducirOperador(op) }}</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Valor</mat-label>
                <input matInput formControlName="valor" />
              </mat-form-field>
              <button mat-icon-button color="warn" (click)="removerFiltro(i)" type="button"><mat-icon>close</mat-icon></button>
            </div>
          </div>
          <button mat-stroked-button (click)="agregarFiltro()" type="button" class="m-b-16">
            <mat-icon>add</mat-icon> Agregar Filtro
          </button>
        </div>

        <div *ngIf="vistaSeleccionada" class="qbe-section">
          <h3>Agrupación y Métricas</h3>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Agrupar por</mat-label>
            <mat-select formControlName="agrupar_por" multiple>
              <mat-option *ngFor="let c of camposAgrupables" [value]="c.nombre">{{ c.etiqueta }}</mat-option>
            </mat-select>
          </mat-form-field>

          <div formArrayName="metricas">
            <div *ngFor="let m of metricas.controls; let i = index" [formGroupName]="i" class="filtro-row">
              <mat-form-field appearance="outline">
                <mat-label>Campo</mat-label>
                <mat-select formControlName="campo">
                  <mat-option *ngFor="let c of camposAgregables" [value]="c.nombre">{{ c.etiqueta }}</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Operación</mat-label>
                <mat-select formControlName="operacion">
                  <mat-option value="sum">Suma</mat-option>
                  <mat-option value="count">Conteo</mat-option>
                  <mat-option value="avg">Promedio</mat-option>
                  <mat-option value="min">Mínimo</mat-option>
                  <mat-option value="max">Máximo</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Alias</mat-label>
                <input matInput formControlName="alias" />
              </mat-form-field>
              <button mat-icon-button color="warn" (click)="removerMetrica(i)" type="button"><mat-icon>close</mat-icon></button>
            </div>
          </div>
          <button mat-stroked-button (click)="agregarMetrica()" type="button" class="m-b-16">
            <mat-icon>add</mat-icon> Agregar Métrica
          </button>
        </div>

        <div *ngIf="vistaSeleccionada" class="qbe-section">
          <h3>Having</h3>
          <div formArrayName="filtros_having">
            <div *ngFor="let h of filtrosHaving.controls; let i = index" [formGroupName]="i" class="filtro-row">
              <mat-form-field appearance="outline">
                <mat-label>Alias</mat-label>
                <input matInput formControlName="alias" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Operador</mat-label>
                <mat-select formControlName="operador">
                  <mat-option value="gte">>=</mat-option>
                  <mat-option value="lte"><=</mat-option>
                  <mat-option value="gt">></mat-option>
                  <mat-option value="lt"><</mat-option>
                  <mat-option value="exact">=</mat-option>
                  <mat-option value="neq">!=</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Valor</mat-label>
                <input matInput formControlName="valor" />
              </mat-form-field>
              <button mat-icon-button color="warn" (click)="removerHaving(i)" type="button"><mat-icon>close</mat-icon></button>
            </div>
          </div>
          <button mat-stroked-button (click)="agregarHaving()" type="button" class="m-b-16">
            <mat-icon>add</mat-icon> Agregar Having
          </button>
        </div>

        <div *ngIf="vistaSeleccionada" class="qbe-section">
          <h3>Orden y Paginación</h3>
          <div class="orden-grid">
            <mat-form-field appearance="outline">
              <mat-label>Ordenar por</mat-label>
              <input matInput formControlName="ordenar_por" placeholder="-campo o campo" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Página</mat-label>
              <input matInput type="number" formControlName="pagina" min="1" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Por página</mat-label>
              <input matInput type="number" formControlName="cantidad_por_pagina" min="1" max="200" />
            </mat-form-field>
          </div>
        </div>

        <div class="qbe-actions">
          <button mat-raised-button color="primary" (click)="enviarQBE()" [disabled]="isLoading || !vistaSeleccionada" type="button">
            <mat-spinner *ngIf="isLoading" diameter="18" style="display:inline-block;margin-right:8px;"></mat-spinner>
            <mat-icon *ngIf="!isLoading">play_arrow</mat-icon>
            Ejecutar
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .qbe-container { padding: 16px 0; }
    .qbe-form { display: flex; flex-direction: column; gap: 8px; }
    .full-width { width: 100%; }
    .qbe-section { margin: 16px 0; }
    .qbe-section h3 { margin: 0 0 12px 0; font-weight: 500; color: #333; font-size: 15px; }
    .filtro-row { display: flex; gap: 12px; align-items: center; margin-bottom: 8px; flex-wrap: wrap; }
    .filtro-row mat-form-field { flex: 1; min-width: 150px; }
    .m-b-16 { margin-bottom: 16px; }
    .m-y-16 { margin: 16px 0; }
    .orden-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .qbe-actions { margin-top: 16px; }
    .ganancias-panel { background: #fff8e1; border: 1px solid #ffe082; border-radius: 8px; padding: 16px; margin-bottom: 8px; }
    .ganancias-panel h3 { margin: 0 0 12px 0; font-weight: 500; color: #e65100; font-size: 15px; }
    .ganancias-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .ganancias-row mat-form-field { flex: 1; min-width: 140px; }
    .ganancias-row button { height: 56px; white-space: nowrap; }
    @media (max-width: 768px) {
      .filtro-row { flex-direction: column; }
      .filtro-row mat-form-field { width: 100%; }
      .orden-grid { grid-template-columns: 1fr; }
      .ganancias-row { flex-direction: column; }
      .ganancias-row mat-form-field { width: 100%; }
      .ganancias-row button { width: 100%; }
    }
  `]
})
export class QbeBuilderComponent implements OnInit {
  @Input() isLoading = false;
  @Output() ejecutarQBE = new EventEmitter<{ resultados: ReporteRespuesta; nombre: string }>();

  vistas: VistaLogica[] = [];
  vistaSeleccionada: VistaLogica | null = null;
  camposDisponibles: CampoVista[] = [];
  camposAgrupables: CampoVista[] = [];
  camposAgregables: CampoVista[] = [];

  meses = [
    { valor: 0, label: 'Todos los meses' },
    { valor: 1, label: 'Enero' }, { valor: 2, label: 'Febrero' }, { valor: 3, label: 'Marzo' },
    { valor: 4, label: 'Abril' }, { valor: 5, label: 'Mayo' }, { valor: 6, label: 'Junio' },
    { valor: 7, label: 'Julio' }, { valor: 8, label: 'Agosto' }, { valor: 9, label: 'Septiembre' },
    { valor: 10, label: 'Octubre' }, { valor: 11, label: 'Noviembre' }, { valor: 12, label: 'Diciembre' },
  ];
  groupByOptions = [
    { valor: 'categoria', label: 'Categoría' },
    { valor: 'marca', label: 'Marca' },
    { valor: 'producto', label: 'Producto' },
    { valor: 'variante', label: 'Variante' },
  ];
  gananciasMes = new Date().getMonth() + 1;
  gananciasGroupBy = 'categoria';
  gananciasCargando = false;

  form: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private reportesService: ReportesService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      vista_logica: ['', Validators.required],
      filtros: this.fb.array([]),
      agrupar_por: [[]],
      metricas: this.fb.array([]),
      filtros_having: this.fb.array([]),
      ordenar_por: [''],
      pagina: [1],
      cantidad_por_pagina: [50],
    });
  }

  ngOnInit(): void {
    this.reportesService.getVistas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.vistas = res.vistas;
          if (this.vistas.length) {
            this.form.patchValue({ vista_logica: this.vistas[0].nombre });
            this.onVistaChange();
          }
        },
        error: () => this.snackBar.open('Error al cargar vistas', 'Cerrar', { duration: 5000 })
      });
  }

  get filtros(): FormArray { return this.form.get('filtros') as FormArray; }
  get metricas(): FormArray { return this.form.get('metricas') as FormArray; }
  get filtrosHaving(): FormArray { return this.form.get('filtros_having') as FormArray; }

  private esCampoTecnico(nombre: string): boolean {
    return nombre === 'id' || nombre.endsWith('_id');
  }

  traducirOperador(op: string): string {
    const map: Record<string, string> = {
      exact: 'es exactamente',
      neq: 'no es igual a',
      gte: 'mayor o igual que',
      lte: 'menor o igual que',
      gt: 'mayor que',
      lt: 'menor que',
      contains: 'contiene',
      icontains: 'contiene (sin mayúsculas)',
      startswith: 'comienza con',
      month: 'es del mes',
      year: 'es del año',
      day: 'es del día',
    };
    return map[op] || op;
  }

  onVistaChange(): void {
    const nombre = this.form.get('vista_logica')?.value;
    this.vistaSeleccionada = this.vistas.find(v => v.nombre === nombre) || null;
    if (this.vistaSeleccionada) {
      const todos = this.vistaSeleccionada.campos;
      this.camposDisponibles = todos.filter(c => !this.esCampoTecnico(c.nombre));
      this.camposAgrupables = todos.filter(c => c.agrupable && !this.esCampoTecnico(c.nombre));
      this.camposAgregables = todos.filter(c => c.agregable && !this.esCampoTecnico(c.nombre));
    }
  }

  getOperadoresParaFiltro(f: any): string[] {
    const campoNombre = f.get('campo')?.value;
    if (!campoNombre || !this.vistaSeleccionada) return ['exact'];
    const campo = this.vistaSeleccionada.campos.find(c => c.nombre === campoNombre);
    return campo ? campo.operadores : ['exact'];
  }

  agregarFiltro(): void {
    this.filtros.push(this.fb.group({
      campo: ['', Validators.required],
      operador: ['exact'],
      valor: [''],
    }));
  }

  removerFiltro(i: number): void {
    this.filtros.removeAt(i);
  }

  agregarMetrica(): void {
    this.metricas.push(this.fb.group({
      campo: ['', Validators.required],
      operacion: ['sum'],
      alias: [''],
    }));
  }

  removerMetrica(i: number): void {
    this.metricas.removeAt(i);
  }

  agregarHaving(): void {
    this.filtrosHaving.push(this.fb.group({
      alias: ['', Validators.required],
      operador: ['gte'],
      valor: [''],
    }));
  }

  removerHaving(i: number): void {
    this.filtrosHaving.removeAt(i);
  }

  enviarQBE(): void {
    if (!this.form.get('vista_logica')?.value) {
      this.snackBar.open('Selecciona una vista lógica', 'Cerrar', { duration: 3000 });
      return;
    }

    const raw = this.form.value;
    const payload: QbePayload = {
      vista_logica: raw.vista_logica,
      paginacion: { pagina: raw.pagina || 1, cantidad_por_pagina: raw.cantidad_por_pagina || 50 },
    };

    if (raw.filtros?.length) {
      payload.filtros = raw.filtros.map((f: any) => ({
        campo: f.campo,
        operador: f.operador || 'exact',
        valor: isNaN(Number(f.valor)) ? f.valor : Number(f.valor),
      }));
    }

    if (raw.agrupar_por?.length) {
      payload.agrupar_por = raw.agrupar_por;
    }

    if (raw.metricas?.length) {
      payload.metricas_agrupadas = raw.metricas.map((m: any) => ({
        campo: m.campo,
        operacion: m.operacion,
        alias: m.alias || `${m.campo}_${m.operacion}`,
      }));
    }

    if (raw.filtros_having?.length) {
      payload.filtros_having = raw.filtros_having.map((h: any) => ({
        alias: h.alias,
        operador: h.operador,
        valor: isNaN(Number(h.valor)) ? h.valor : Number(h.valor),
      }));
    }

    if (raw.ordenar_por) {
      payload.ordenar_por = raw.ordenar_por;
    }

    this.reportesService.ejecutarQBE(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.ejecutarQBE.emit({ resultados: res, nombre: `qbe-${raw.vista_logica}` });
          this.snackBar.open(`Reporte ejecutado: ${res.paginacion.total_registros} registros`, 'OK', { duration: 3000 });
        },
        error: (err) => {
          const msg = err.error?.error || err.error?.message || 'Error al ejecutar reporte';
          this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
        }
      });
  }

  generarGanancias(): void {
    const groupByMap: Record<string, string[]> = {
      categoria: ['categoria_id', 'categoria_nombre'],
      marca: ['marca_id', 'marca_nombre'],
      producto: ['producto_id', 'producto_nombre'],
      variante: ['variante_id', 'variante_sku', 'producto_nombre'],
    };

    const payload: QbePayload = {
      vista_logica: 'detalle_venta',
      ...(this.gananciasMes ? { filtros: [{ campo: 'venta_fecha', operador: 'month', valor: this.gananciasMes }] } : {}),
      agrupar_por: groupByMap[this.gananciasGroupBy] || groupByMap['categoria'],
      metricas_agrupadas: [
        { campo: 'ganancia', operacion: 'sum', alias: 'ganancia_total' },
      ],
      ordenar_por: '-ganancia_total',
    };

    this.gananciasCargando = true;
    this.reportesService.ejecutarQBE(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.gananciasCargando = false;
          this.ejecutarQBE.emit({ resultados: res, nombre: `ganancias-${this.gananciasGroupBy}` });
          this.snackBar.open(`Ganancias: ${res.paginacion.total_registros} registros`, 'OK', { duration: 3000 });
        },
        error: (err) => {
          this.gananciasCargando = false;
          const msg = err.error?.error || err.error?.message || 'Error al generar ganancias';
          this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
