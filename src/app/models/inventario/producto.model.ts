export interface Multimedia {
  id: number;
  nombre: string;
  archivo_url: string;
  es_principal: boolean;
  orden: number;
}

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  precio: number;
  categoria: number;
  categoria_nombre: string;
  imagenes: Multimedia[];
}

export interface CrearProducto {
  codigo: string;
  nombre: string;
  precio: number;
  categoria_id: number;
}

export interface CrearMultimedia {
  nombre: string;
  archivo_url: string;
  tipo: 'imagen';
  es_principal: boolean;
  orden: number;
  producto_id: number;
}