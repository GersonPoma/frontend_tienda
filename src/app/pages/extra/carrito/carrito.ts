import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { CartService, Carrito } from '../../../services/cart.service';
import { ConfigService } from '../../../services/config.service';
import { Producto } from '../../../models/inventario/producto.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule
  ],
  templateUrl: './carrito.html',
  styleUrls: ['./carrito.scss']
})
export class CarritoComponent implements OnInit {
  carrito: Carrito | null = null;
  displayedColumns: string[] = ['producto', 'precio', 'cantidad', 'subtotal', 'acciones'];
  productosRecomendados: Producto[] = [];
  variantesRecomendados: { [productoId: number]: any[] } = {};
  idsEnCarrito = new Set<number>();

  constructor(
    private cartService: CartService,
    private snackBar: MatSnackBar,
    private router: Router,
    private http: HttpClient,
    private configService: ConfigService,
  ) {}

  ngOnInit(): void {
    this.cartService.carrito$.subscribe(carrito => {
      this.carrito = carrito;
      this.cargarRecomendados();
    });
  }

  private cargarRecomendados(): void {
    const detalles = this.carrito?.detalles || [];
    if (detalles.length === 0) {
      this.productosRecomendados = [];
      this.variantesRecomendados = {};
      return;
    }

    const productoIds = [...new Set(detalles.map(d => d.variante_producto_info.producto))];
    this.idsEnCarrito = new Set(productoIds);

    const baseUrl = this.configService.getApiUrl('productos');
    const requests = productoIds.map(id =>
      this.http.get<Producto[]>(`${baseUrl}${id}/recomendados/`).pipe(
        catchError(() => of([]))
      )
    );

    forkJoin(requests).subscribe(results => {
      const seen = new Set<number>();
      this.productosRecomendados = results
        .flat()
        .filter(p => !this.idsEnCarrito.has(p.id))
        .filter(p => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        })
        .slice(0, 10);

      this.cargarVariantesRecomendados();
    });
  }

  private cargarVariantesRecomendados(): void {
    if (this.productosRecomendados.length === 0) return;

    const baseUrl = this.configService.getApiUrl('variantes');
    const requests = this.productosRecomendados.map(p =>
      this.http.get<any[]>(`${baseUrl}?producto_id=${p.id}`).pipe(
        catchError(() => of([]))
      )
    );

    forkJoin(requests).subscribe(results => {
      this.variantesRecomendados = {};
      this.productosRecomendados.forEach((p, i) => {
        this.variantesRecomendados[p.id] = results[i].slice(0, 5);
      });
    });
  }

  agregarRecomendado(productoId: number, varianteId: number): void {
    const producto = this.productosRecomendados.find(p => p.id === productoId);
    this.cartService.agregarProducto(varianteId).subscribe({
      next: () => {
        this.snackBar.open(`${producto?.nombre || 'Producto'} agregado al carrito`, 'Cerrar', { duration: 2000 });
      },
      error: (err) => {
        this.snackBar.open(err.error?.error || 'Error al agregar', 'Cerrar', { duration: 3000 });
      }
    });
  }

  actualizarCantidad(varianteId: number, event: any): void {
    const cantidad = parseInt(event.target.value, 10);
    if (cantidad > 0) {
      this.cartService.actualizarCantidad(varianteId, cantidad).subscribe({
        error: (err) => {
          this.snackBar.open(err.error?.error || 'Error al actualizar', 'Cerrar', { duration: 3000 });
          this.cartService.cargarCarrito();
        }
      });
    }
  }

  eliminarItem(varianteId: number): void {
    this.cartService.eliminarProducto(varianteId).subscribe(() => {
      this.snackBar.open('Producto eliminado', 'Cerrar', { duration: 2000 });
    });
  }

  vaciarCarrito(): void {
    this.cartService.vaciarCarrito().subscribe(() => {
      this.snackBar.open('Carrito vaciado', 'Cerrar', { duration: 2000 });
    });
  }

  irACatalogo(): void {
    this.router.navigate(['/extra/catalogo']);
  }

  descargarPdf(): void {
    this.snackBar.open('Generando PDF...', 'Cerrar', { duration: 2000 });
    this.cartService.descargarPdf().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style.display = 'none';
        a.href = url;
        a.download = `Cotizacion_${new Date().getTime()}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (err) => {
        this.snackBar.open('Error al generar el PDF', 'Cerrar', { duration: 3000 });
      }
    });
  }
}
