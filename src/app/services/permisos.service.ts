import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Servicio centralizado para gestionar permisos del sistema
 * Define constantes de permisos y métodos para verificarlos
 */
@Injectable({
  providedIn: 'root'
})
export class PermisosService {
  // INVENTARIO - PRODUCTO
  static readonly INVENTARIO_VIEW_PRODUCTO = 'inventario.view_producto';
  static readonly INVENTARIO_ADD_PRODUCTO = 'inventario.add_producto';
  static readonly INVENTARIO_CHANGE_PRODUCTO = 'inventario.change_producto';
  static readonly INVENTARIO_DELETE_PRODUCTO = 'inventario.delete_producto';

  // INVENTARIO - CATEGORÍA
  static readonly INVENTARIO_VIEW_CATEGORIA = 'inventario.view_categoria';
  static readonly INVENTARIO_ADD_CATEGORIA = 'inventario.add_categoria';
  static readonly INVENTARIO_CHANGE_CATEGORIA = 'inventario.change_categoria';
  static readonly INVENTARIO_DELETE_CATEGORIA = 'inventario.delete_categoria';

  // INVENTARIO - PROVEEDOR
  static readonly INVENTARIO_VIEW_PROVEEDOR = 'inventario.view_proveedor';
  static readonly INVENTARIO_ADD_PROVEEDOR = 'inventario.add_proveedor';
  static readonly INVENTARIO_CHANGE_PROVEEDOR = 'inventario.change_proveedor';
  static readonly INVENTARIO_DELETE_PROVEEDOR = 'inventario.delete_proveedor';

  // INVENTARIO - MULTIMEDIA
  static readonly INVENTARIO_VIEW_MULTIMEDIO = 'inventario.view_multimedio';
  static readonly INVENTARIO_ADD_MULTIMEDIO = 'inventario.add_multimedio';
  static readonly INVENTARIO_CHANGE_MULTIMEDIO = 'inventario.change_multimedio';
  static readonly INVENTARIO_DELETE_MULTIMEDIO = 'inventario.delete_multimedio';

  // SEGURIDAD - USUARIO
  static readonly SEGURIDAD_VIEW_USUARIO = 'seguridad.view_usuario';
  static readonly SEGURIDAD_ADD_USUARIO = 'seguridad.add_usuario';
  static readonly SEGURIDAD_CHANGE_USUARIO = 'seguridad.change_usuario';
  static readonly SEGURIDAD_DELETE_USUARIO = 'seguridad.delete_usuario';

  // AUTH - GRUPO (ROL)
  static readonly AUTH_VIEW_GROUP = 'auth.view_group';
  static readonly AUTH_ADD_GROUP = 'auth.add_group';
  static readonly AUTH_CHANGE_GROUP = 'auth.change_group';
  static readonly AUTH_DELETE_GROUP = 'auth.delete_group';

  // AUTH - PERMISO
  static readonly AUTH_VIEW_PERMISSION = 'auth.view_permission';
  static readonly AUTH_CHANGE_PERMISSION = 'auth.change_permission';

  constructor(private authService: AuthService) {}

  /**
   * Verificar si tiene un permiso específico
   * Los superusuarios tienen acceso a todo
   */
  tiene(permiso: string): boolean {
    // Los superusuarios tienen todos los permisos
    if (this.authService.isSuperuser()) {
      return true;
    }
    return this.authService.hasPermiso(permiso);
  }

  /**
   * Verificar si tiene alguno de los permisos especificados
   * Los superusuarios tienen acceso a todo
   */
  tieneAlguno(permisos: string[]): boolean {
    // Los superusuarios tienen todos los permisos
    if (this.authService.isSuperuser()) {
      return true;
    }
    return this.authService.hasAnyPermiso(permisos);
  }

  /**
   * Verificar si tiene todos los permisos especificados
   * Los superusuarios tienen acceso a todo
   */
  tieneTodos(permisos: string[]): boolean {
    // Los superusuarios tienen todos los permisos
    if (this.authService.isSuperuser()) {
      return true;
    }
    return permisos.every(p => this.authService.hasPermiso(p));
  }

  /**
   * Métodos de conveniencia para funcionalidades comunes
   */

  // PRODUCTO
  puedeVerProducto(): boolean {
    return this.tiene(PermisosService.INVENTARIO_VIEW_PRODUCTO);
  }

  puedeCrearProducto(): boolean {
    return this.tiene(PermisosService.INVENTARIO_ADD_PRODUCTO);
  }

  puedeEditarProducto(): boolean {
    return this.tiene(PermisosService.INVENTARIO_CHANGE_PRODUCTO);
  }

  puedeEliminarProducto(): boolean {
    return this.tiene(PermisosService.INVENTARIO_DELETE_PRODUCTO);
  }

  // CATEGORÍA
  puedeVerCategoria(): boolean {
    return this.tiene(PermisosService.INVENTARIO_VIEW_CATEGORIA);
  }

  puedeCrearCategoria(): boolean {
    return this.tiene(PermisosService.INVENTARIO_ADD_CATEGORIA);
  }

  puedeEditarCategoria(): boolean {
    return this.tiene(PermisosService.INVENTARIO_CHANGE_CATEGORIA);
  }

  puedeEliminarCategoria(): boolean {
    return this.tiene(PermisosService.INVENTARIO_DELETE_CATEGORIA);
  }

  // PROVEEDOR
  puedeVerProveedor(): boolean {
    return this.tiene(PermisosService.INVENTARIO_VIEW_PROVEEDOR);
  }

  puedeCrearProveedor(): boolean {
    return this.tiene(PermisosService.INVENTARIO_ADD_PROVEEDOR);
  }

  puedeEditarProveedor(): boolean {
    return this.tiene(PermisosService.INVENTARIO_CHANGE_PROVEEDOR);
  }

  puedeEliminarProveedor(): boolean {
    return this.tiene(PermisosService.INVENTARIO_DELETE_PROVEEDOR);
  }

  // MULTIMEDIA
  puedeVerMultimedia(): boolean {
    return this.tiene(PermisosService.INVENTARIO_VIEW_MULTIMEDIO);
  }

  puedeCrearMultimedia(): boolean {
    return this.tiene(PermisosService.INVENTARIO_ADD_MULTIMEDIO);
  }

  puedeEditarMultimedia(): boolean {
    return this.tiene(PermisosService.INVENTARIO_CHANGE_MULTIMEDIO);
  }

  puedeEliminarMultimedia(): boolean {
    return this.tiene(PermisosService.INVENTARIO_DELETE_MULTIMEDIO);
  }

  // USUARIO
  puedeVerUsuario(): boolean {
    return this.tiene(PermisosService.SEGURIDAD_VIEW_USUARIO);
  }

  puedeCrearUsuario(): boolean {
    return this.tiene(PermisosService.SEGURIDAD_ADD_USUARIO);
  }

  puedeEditarUsuario(): boolean {
    return this.tiene(PermisosService.SEGURIDAD_CHANGE_USUARIO);
  }

  puedeEliminarUsuario(): boolean {
    return this.tiene(PermisosService.SEGURIDAD_DELETE_USUARIO);
  }

  // ROL/GRUPO
  puedeVerRol(): boolean {
    return this.tiene(PermisosService.AUTH_VIEW_GROUP);
  }

  puedeCrearRol(): boolean {
    return this.tiene(PermisosService.AUTH_ADD_GROUP);
  }

  puedeEditarRol(): boolean {
    return this.tiene(PermisosService.AUTH_CHANGE_GROUP);
  }

  puedeEliminarRol(): boolean {
    return this.tiene(PermisosService.AUTH_DELETE_GROUP);
  }

  // PERMISO
  puedeVerPermiso(): boolean {
    return this.tiene(PermisosService.AUTH_VIEW_PERMISSION);
  }

  puedeEditarPermiso(): boolean {
    return this.tiene(PermisosService.AUTH_CHANGE_PERMISSION);
  }
}
