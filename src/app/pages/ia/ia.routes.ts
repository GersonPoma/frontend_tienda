import { Routes } from '@angular/router';

export const IaRoutes: Routes = [
  {
    path: 'alertas',
    loadComponent: () =>
      import('./alertas/alertas-ia.component').then(m => m.AlertasIaComponent),
    data: {
      title: 'Alertas IA',
      urls: [{ title: 'Dashboard', url: '/' }, { title: 'Alertas IA' }]
    }
  },
  {
    path: 'prediccion',
    loadComponent: () =>
      import('./prediccion/prediccion-ia.component').then(m => m.PrediccionIaComponent),
    data: {
      title: 'Predicción de Demanda',
      urls: [{ title: 'Dashboard', url: '/' }, { title: 'Predicción IA' }]
    }
  }
];
