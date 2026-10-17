export type CategoriaProducto = 'ROSTRO' | 'CEJAS' | 'LABIOS' | 'OJOS';

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  cantidadInicial: number;
  totalProducto: number;
  categoria: CategoriaProducto;
}

export interface ProductoInput {
  nombre: string;
  precio: number;
  cantidad: number;
  categoria: CategoriaProducto;
}

export interface FacturaDetalleInput {
  producto: {
    id: number;
  };
  cantidad: number;
}

export interface FacturaInput {
  detalles: FacturaDetalleInput[];
}

export interface DetalleFactura {
  id?: number;
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Factura {
  id: number;
  fecha?: string;
  totalFactura: number;
  detalles: DetalleFactura[];
}

export interface Usuario {
  username: string;
  fullName: string;
  role: string;
}

export type FilterCategory = 'TODAS' | CategoriaProducto;

export type FilterStock = 'TODOS' | 'CRITICO' | 'SALUDABLE';

export type ViewMode = 'table' | 'grid';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}
