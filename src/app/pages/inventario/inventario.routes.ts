import { Routes } from '@angular/router';
import { CategoriaComponent } from './categoria/categoria';
import { ProductoComponent } from './producto/producto';
import { ProveedorComponent } from './proveedor/proveedor';

export const InventarioRoutes: Routes = [
  { path: 'categorias', component: CategoriaComponent },
  { path: 'productos', component: ProductoComponent },
  { path: 'proveedores', component: ProveedorComponent },
];