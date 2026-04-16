import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { RolComponent } from './rol/rol';
import { Autenticacion } from './autenticacion/autenticacion';
import { UsuarioComponent } from './usuario/usuario';
import { RecuperarPasswordComponent } from './recuperar-password/recuperar-password.component';
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

// Rutas públicas (sin sidebar) - Login y Registro
export const SeguridadAuthRoutes: Routes = [
  {
    path: '',
    component: Autenticacion,
    data: {
      title: 'Autenticación'
    }
  }
];

// Rutas públicas (sin sidebar) - Recuperación de contraseña
export const RecuperarPasswordRoutes: Routes = [
  {
    path: '',
    component: RecuperarPasswordComponent,
    data: {
      title: 'Recuperar Contraseña'
    }
  }
];

// Rutas protegidas (con sidebar) - Administración de Seguridad
export const SeguridadRoutes: Routes = [
  {
    path: 'roles',
    component: RolComponent,
    canActivate: [canAccessWithPermiso(PermisosService.AUTH_VIEW_GROUP)],
    data: {
      title: 'Gestión de Roles',
      urls: [
        { title: 'Seguridad', url: '/seguridad' },
        { title: 'Roles' },
      ]
    }
  },
  {
    path: 'usuarios',
    component: UsuarioComponent,
    canActivate: [canAccessWithPermiso(PermisosService.SEGURIDAD_VIEW_USUARIO)],
    data: {
      title: 'Gestión de Usuarios',
      urls: [
        { title: 'Seguridad', url: '/seguridad' },
        { title: 'Usuarios' },
      ]
    }
  }
];
