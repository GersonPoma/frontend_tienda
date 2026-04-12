import { Routes } from '@angular/router';
import { CategoriaComponent } from './categoria/categoria';
import { ProductoComponent } from './producto/producto';

export const InventarioRoutes: Routes = [
  { path: 'categorias', component: CategoriaComponent },
  { path: 'productos', component: ProductoComponent },
];