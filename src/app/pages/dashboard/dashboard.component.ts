import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { PermisosService } from '../../services/permisos.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  nombreUsuario: string = '';
  isSuperuser: boolean = false;
  tieneAccesoInventario = false;
  tieneAccesoSeguridad = false;
  tieneAccesoProductos = false;
  tieneAccesoCategorias = false;
  tieneAccesoProveedores = false;
  tieneAccesoUsuarios = false;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private permisosService: PermisosService
  ) {}

  ngOnInit(): void {
    // Obtener nombre del usuario
    const currentState = this.authService.getCurrentAuthState();
    this.nombreUsuario = currentState.nombre_completo || currentState.username || 'Usuario';
    this.isSuperuser = currentState.is_superuser || false;

    // Si es superusuario, tiene acceso a todo
    if (this.isSuperuser) {
      this.tieneAccesoProductos = true;
      this.tieneAccesoCategorias = true;
      this.tieneAccesoProveedores = true;
      this.tieneAccesoInventario = true;
      this.tieneAccesoUsuarios = true;
      this.tieneAccesoSeguridad = true;
      return;
    }

    // Verificar permisos de módulos para usuarios normales
    this.tieneAccesoProductos = this.authService.hasPermiso(
      PermisosService.INVENTARIO_VIEW_PRODUCTO
    );
    this.tieneAccesoCategorias = this.authService.hasPermiso(
      PermisosService.INVENTARIO_VIEW_CATEGORIA
    );
    this.tieneAccesoProveedores = this.authService.hasPermiso(
      PermisosService.INVENTARIO_VIEW_PROVEEDOR
    );
    this.tieneAccesoInventario =
      this.tieneAccesoProductos ||
      this.tieneAccesoCategorias ||
      this.tieneAccesoProveedores;

    this.tieneAccesoUsuarios = this.authService.hasPermiso(
      PermisosService.SEGURIDAD_VIEW_USUARIO
    );
    this.tieneAccesoSeguridad = this.tieneAccesoUsuarios;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
