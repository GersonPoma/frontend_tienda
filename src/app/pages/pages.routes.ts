import { Routes } from '@angular/router';
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
  {
    path: 'compra',
    loadChildren: () =>
      import('./compra/compra.routes').then((m) => m.CompraRoutes),
  },
  {
    path: 'reportes',
    loadChildren: () =>
      import('./reportes/reportes.routes').then((m) => m.ReportesRoutes),
  },
  {
    path: 'ventas',
    loadChildren: () =>
      import('./venta/venta.routes').then((m) => m.VentaRoutes),
  },
  {
    path: 'configuracion',
    loadComponent: () =>
      import('./empresa/configuracion/configuracion.component').then((m) => m.ConfiguracionComponent),
    data: {
      title: 'Configuración de Empresa',
      urls: [
        { title: 'Dashboard', url: '/' },
        { title: 'Configuración' }
      ]
    }
  },
];
