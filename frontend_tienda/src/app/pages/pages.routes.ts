import { Routes } from '@angular/router';
import { StarterComponent } from './starter/starter.component';

export const PagesRoutes: Routes = [
  {
    path: '',
    component: StarterComponent,
    data: {
      title: 'Starter',
      urls: [
        { title: 'Dashboard', url: '/' },
        { title: 'Starter' },
      ],
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
