import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CategoriaComponent } from './categoria/categoria';
import { ProductoComponent } from './producto/producto';
import { ProveedorComponent } from './proveedor/proveedor';
import { PermisosService } from '../../services/permisos.service';
import { AuthService } from '../../services/auth.service';

/**
 * Guard funcional para verificar permisos
 */
const canAccessWithPermiso = (permisos: string | string[]) => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const permisosArray = Array.isArray(permisos) ? permisos : [permisos];

    if (authService.hasAnyPermiso(permisosArray)) {
      return true;
    }

    router.navigate(['/']);
    return false;
  };
};

export const InventarioRoutes: Routes = [
  {
    path: 'categorias',
    component: CategoriaComponent,
    canActivate: [canAccessWithPermiso(PermisosService.INVENTARIO_VIEW_CATEGORIA)]
  },
  {
    path: 'productos',
    component: ProductoComponent,
    canActivate: [canAccessWithPermiso(PermisosService.INVENTARIO_VIEW_PRODUCTO)]
  },
  {
    path: 'proveedores',
    component: ProveedorComponent,
    canActivate: [canAccessWithPermiso(PermisosService.INVENTARIO_VIEW_PROVEEDOR)]
  },
];