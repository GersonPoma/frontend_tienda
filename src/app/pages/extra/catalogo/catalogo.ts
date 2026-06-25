import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';
import { ConfigService } from 'src/app/services/config.service';
import { CartService } from 'src/app/services/cart.service';
import { FavoritosService } from 'src/app/services/favoritos.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MaterialModule } from 'src/app/material.module';
import { Subject } from 'rxjs';

import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  categoria_nombre: string;
  categoria: number;
  imagen_principal: string;
  precio_minimo: number;
  calificacion_promedio: number | null;
  total_resenas: number;
}

interface Categoria {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MaterialModule,
    FormsModule
  ],

  templateUrl: './catalogo.html',
  styleUrls: ['./catalogo.scss']
})
export class CatalogoComponent implements OnInit {
  productos: Producto[] = [];
  categorias: Categoria[] = [];
  categoriaSeleccionada: number | null = null;
  terminoBusqueda: string = '';
  cargando: boolean = true;
  favoritosIds: Set<number> = new Set();
  
  private searchSubject = new Subject<string>();

  constructor(
    private apiService: ApiService,
    private configService: ConfigService,
    private cartService: CartService,
    private favoritosService: FavoritosService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    // Configurar búsqueda con debounce (300ms)
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.terminoBusqueda = term;
      this.cargarProductos();
    });
  }

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarProductos();
    this.favoritosService.favoritos$.subscribe(favoritos => {
      this.favoritosIds = new Set(favoritos.map(f => f.producto_id));
    });
  }

  cargarCategorias(): void {
    const url = this.configService.getApiUrl('categorias');
    this.apiService.getWithPagination<Categoria>(url, 1, 100).subscribe(res => {
      this.categorias = res.results;
    });
  }

  cargarProductos(): void {
    this.cargando = true;
    const url = this.configService.getApiUrl('catalogo');
    const params: any = { page_size: 20 };
    
    if (this.categoriaSeleccionada) {
      params.categoria = this.categoriaSeleccionada;
    }
    
    if (this.terminoBusqueda) {
      params.search = this.terminoBusqueda;
    }

    this.apiService.getWithPagination<Producto>(url, 1, 20, params).subscribe({
      next: (res) => {
        this.productos = res.results;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.snackBar.open('Error al cargar productos', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onSearch(event: any): void {
    this.searchSubject.next(event.target.value);
  }

  seleccionarCategoria(id: number | null): void {
    this.categoriaSeleccionada = id;
    this.cargarProductos();
  }

  verDetalles(id: number): void {
    this.router.navigate(['/inventario/productos', id]);
  }

  esFavorito(productoId: number): boolean {
    return this.favoritosIds.has(productoId);
  }

  toggleFavorito(prod: Producto): void {
    if (this.esFavorito(prod.id)) {
      this.favoritosService.eliminarPorProducto(prod.id).subscribe({
        next: () => {
          this.snackBar.open(`${prod.nombre} eliminado de favoritos`, 'Cerrar', { duration: 2000 });
        },
        error: () => {
          this.snackBar.open('Error al quitar de favoritos', 'Cerrar', { duration: 3000 });
        }
      });
    } else {
      this.favoritosService.agregar(prod.id).subscribe({
        next: () => {
          this.snackBar.open(`${prod.nombre} agregado a favoritos`, 'Cerrar', { duration: 2000 });
        },
        error: (err) => {
          this.snackBar.open(err.error?.error || 'Error al agregar a favoritos', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  getEstrellas(calificacion: number): string[] {
    const estrellas: string[] = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(calificacion)) {
        estrellas.push('star');
      } else if (i - calificacion < 1 && i - calificacion > 0) {
        estrellas.push('star_half');
      } else {
        estrellas.push('star_border');
      }
    }
    return estrellas;
  }
}
