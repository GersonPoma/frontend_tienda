import { Routes } from '@angular/router';
import { RolComponent } from './rol/rol';
import { Autenticacion } from './autenticacion/autenticacion';
import { UsuarioComponent } from './usuario/usuario';

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

// Rutas protegidas (con sidebar) - Administración de Seguridad
export const SeguridadRoutes: Routes = [
  {
    path: 'roles',
    component: RolComponent,
    data: {
      title: 'Gestión de Roles',
      urls: [
        { title: 'Seguridad', url: '/seguridad' },
        { title: 'Roles' },
      ]
    }
  },
  // Aquí irá: usuarios, permisos, etc.
  {
    path: 'usuarios',
    component: UsuarioComponent,
    data: {
      title: 'Gestión de Usuarios',
      urls: [
        { title: 'Seguridad', url: '/seguridad' },
        { title: 'Usuarios' },
      ]
    }
  }
];
