import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';

export const routes: Routes = [
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
    ],
  },
  // Rutas CON sidebar (FullComponent) - Dashboard y Administración
  {
    path: '',
    component: FullComponent,
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
  {
    path: '**',
    redirectTo: '/login',
  },
];
