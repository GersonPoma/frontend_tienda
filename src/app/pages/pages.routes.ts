import { Routes } from '@angular/router';
import { StarterComponent } from './starter/starter.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const PagesRoutes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    data: {
      title: 'Dashboard',
      urls: [{ title: 'Dashboard', url: '/' }],
    },
  },
  {
    path: 'seguridad',
    loadChildren: () =>
      import('./seguridad/seguridad.routes').then((m) => m.SeguridadRoutes),
  },
  {
    path: 'inventario',
    loadChildren: () =>
      import('./inventario/inventario.routes').then((m) => m.InventarioRoutes),
  },
];
