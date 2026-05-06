import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConfigService } from '../../../services/config.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-autenticacion',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './autenticacion.html',
  styleUrl: './autenticacion.scss',
})
export class Autenticacion implements OnInit, OnDestroy {
  tenantName: string = '';
  hidePassword = true;
  isLogin = true;  // true = login, false = registro
  isLoading = false;

  form = new FormGroup({
    username: new FormControl('', [Validators.required, Validators.minLength(3)]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    confirmPassword: new FormControl(''),
  });

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private configService: ConfigService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.tenantName = this.formatTenantName();
  }

  ngOnInit(): void {
    // Detectar si es login o registrar según la URL
    const url = this.router.url;
    this.isLogin = url.includes('/login');
    
    // Agregar validación de confirmación de contraseña solo si es registro
    if (!this.isLogin) {
      this.form.get('confirmPassword')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.form.get('confirmPassword')?.updateValueAndValidity();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Formatear el nombre del tenant
   * Ejemplos:
   * - tienda-amiga → Tienda Amiga
   * - empresa-xyz → Empresa Xyz
   * - null (localhost) → [Desarrollo Local]
   */
  private formatTenantName(): string {
    const tenant = this.configService.getCurrentTenant();
    
    if (!tenant) {
      return '[Desarrollo Local]';
    }

    return tenant
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  get f() {
    return this.form.controls;
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  submit(): void {
    if (this.form.valid) {
      if (this.isLogin) {
        this.handleLogin();
      } else {
        this.handleRegister();
      }
    }
  }

  private handleLogin(): void {
    this.isLoading = true;

    const credentials = {
      username: this.form.value.username || '',
      password: this.form.value.password || ''
    };

    this.authService.login(credentials)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.snackBar.open(`¡Bienvenido ${response.username}!`, 'Cerrar', {
            duration: 3000
          });
          // Pequeño delay para asegurar que se guardaron todos los datos
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 500);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error en login:', error);
          const errorMessage = error.error?.detail || 'Error al iniciar sesión';
          this.snackBar.open(errorMessage, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private handleRegister(): void {
    const passwordsMatch = this.form.value.password === this.form.value.confirmPassword;
    
    if (!passwordsMatch) {
      this.snackBar.open('Las contraseñas no coinciden', 'Cerrar', {
        duration: 5000
      });
      return;
    }

    this.isLoading = true;

    const registerData = {
      username: this.form.value.username || '',
      password: this.form.value.password || ''
    };

    // TODO: Implementar endpoint de registro en el backend
    console.log('Register data:', registerData);
    this.snackBar.open('Registro en desarrollo', 'Cerrar', {
      duration: 3000
    });
    this.isLoading = false;
  }

  toggleAuthMode(): void {
    this.isLogin = !this.isLogin;
    this.form.reset();
  }
}
