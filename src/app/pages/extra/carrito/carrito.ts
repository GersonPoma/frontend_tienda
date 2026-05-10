import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { CartService, Carrito } from '../../../services/cart.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
})
export class CarritoComponent implements OnInit {
  carrito: Carrito | null = null;
  displayedColumns: string[] = ['producto', 'precio', 'cantidad', 'subtotal', 'acciones'];

  constructor(
    private cartService: CartService, 
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cartService.carrito$.subscribe(carrito => {
      this.carrito = carrito;
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

  irAProductos(): void {
    this.router.navigate(['/inventario/productos']);
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
