import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { AuthService } from './services/auth.service';

/**
 * Guard funcional para verificar autenticación
 * Redirige a login si no está autenticado
 */
const canAccessDashboard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

export const routes: Routes = [
  // Rutas CON sidebar (FullComponent) - Dashboard y Administración (va primero)
  {
    path: '',
    component: FullComponent,
    canActivate: [canAccessDashboard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./pages/pages.routes').then((m) => m.PagesRoutes),
      },
      {
        path: 'seguridad',
        loadChildren: () =>
          import('./pages/seguridad/seguridad.routes').then((m) => m.SeguridadRoutes),
      },
      {
        path: 'ui-components',
        loadChildren: () =>
          import('./pages/ui-components/ui-components.routes').then(
            (m) => m.UiComponentsRoutes
          ),
      },
      {
        path: 'extra',
        loadChildren: () =>
          import('./pages/extra/extra.routes').then((m) => m.ExtraRoutes),
      },
    ],
  },
  // Rutas SIN sidebar (BlankComponent) - Login y Registro
  {
    path: '',
    component: BlankComponent,
    children: [
      {
        path: 'login',
        loadChildren: () =>
          import('./pages/seguridad/seguridad.routes').then((m) => m.SeguridadAuthRoutes),
      },
      {
        path: 'registrar',
        loadChildren: () =>
          import('./pages/seguridad/seguridad.routes').then((m) => m.SeguridadAuthRoutes),
      },
      {
        path: 'recuperar-password',
        loadChildren: () =>
          import('./pages/seguridad/seguridad.routes').then((m) => m.RecuperarPasswordRoutes),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
