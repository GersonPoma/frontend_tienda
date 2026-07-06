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
    path: 'notificaciones',
    loadChildren: () =>
      import('./notificaciones/notificaciones.routes').then((m) => m.NotificacionesRoutes),
  },
  {
    path: 'ventas',
    loadChildren: () =>
      import('./venta/venta.routes').then((m) => m.VentaRoutes),
  },
  {
    path: 'favoritos',
    loadComponent: () =>
      import('./favoritos/favoritos.component').then((m) => m.FavoritosComponent),
    data: {
      title: 'Mis Favoritos',
      urls: [
        { title: 'Dashboard', url: '/' },
        { title: 'Mis Favoritos' }
      ]
    }
  },
  {
    path: 'mis-compras',
    loadComponent: () =>
      import('./historial-compras/historial-compras.component').then((m) => m.HistorialComprasComponent),
    data: {
      title: 'Historial de compras',
      urls: [
        { title: 'Dashboard', url: '/' },
        { title: 'Historial de compras' }
      ]
    }
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
  {
    path: 'ia',
    loadChildren: () =>
      import('./ia/ia.routes').then((m) => m.IaRoutes),
  },
  {
    path: 'suscripcion',
    loadComponent: () =>
      import('./empresa/suscripcion/suscripcion.component').then((m) => m.SuscripcionComponent),
    data: {
      title: 'Mi Suscripción',
      urls: [
        { title: 'Dashboard', url: '/' },
        { title: 'Mi Suscripción' }
      ]
    }
  },
  {
    path: 'suscripcion/cambiar-plan',
    loadComponent: () =>
      import('./empresa/suscripcion/cambiar-plan/cambiar-plan.component').then((m) => m.CambiarPlanComponent),
    data: {
      title: 'Cambiar Plan',
      urls: [
        { title: 'Dashboard', url: '/' },
        { title: 'Mi Suscripción', url: '/suscripcion' },
        { title: 'Cambiar Plan' }
      ]
    }
  },
];
