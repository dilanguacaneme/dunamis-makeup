export type CategoriaProducto = 'ROSTRO' | 'CEJAS' | 'LABIOS' | 'OJOS';

export interface Marca {
  id: number;
  nombre: string;
  activa?: boolean;
}

export interface MarcaInput {
  nombre: string;
  activa?: boolean;
}

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  cantidadInicial?: number;
  totalProducto?: number;
  categoria: CategoriaProducto;
  marca?: Marca | null;
}

export interface ProductoInput {
  nombre: string;
  precio: number;
  cantidad: number;
  categoria: CategoriaProducto;
  marca?: {
    id: number;
  };
}

export interface FacturaDetalleInput {
  producto: {
    id: number;
  };
  cantidad: number;
}

export type EstadoPagoFactura = 'PAGADA' | 'ABONO_PARCIAL' | 'PENDIENTE' | 'SIN_REGISTRO';

export interface FacturaInput {
  cliente: string;
  telefonoCliente?: string;
  detalles: FacturaDetalleInput[];
  estadoPago?: EstadoPagoFactura;
  valorAbonado?: number;
}

export interface DetalleFactura {
  id?: number;
  producto: Producto;
  cantidad: number;
  subtotal: number;
}

export interface Factura {
  id: number;
  cliente: string;
  telefonoCliente?: string | null;
  vendedorNombre?: string | null;
  vendedorUsuario?: string | null;
  fecha?: string;
  total: number;
  detalles?: DetalleFactura[];
  estadoPago?: EstadoPagoFactura;
  valorAbonado?: number;
  saldoPendiente?: number;
}

export interface Usuario {
  username: string;
  fullName: string;
  role: 'ADMIN' | 'VENDEDOR';
}

export type FilterCategory = 'TODAS' | CategoriaProducto;

export type FilterStock = 'TODOS' | 'AGOTADOS' | 'DISPONIBLES';

export type FilterPaymentStatus = 'TODOS' | EstadoPagoFactura;

export type ViewMode = 'table' | 'grid';

export type ActiveTab = 'inventory' | 'invoices' | 'monthly-sales' | 'brands';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  timestamp: number;
}

export interface CsrfResponse {
  ready: boolean;
}
