import type { Producto, ProductoInput, FacturaInput, Factura, Usuario } from '../types';

const INITIAL_DEMO_PRODUCTS: Producto[] = [
  {
    id: 1,
    nombre: 'Base Fluida Satinada Glow Foundation',
    precio: 85000,
    cantidad: 2,
    cantidadInicial: 20,
    totalProducto: 170000,
    categoria: 'ROSTRO',
  },
  {
    id: 2,
    nombre: 'Corrector Cremoso Alta Cobertura Radiant Concealer',
    precio: 48000,
    cantidad: 14,
    cantidadInicial: 15,
    totalProducto: 672000,
    categoria: 'ROSTRO',
  },
  {
    id: 3,
    nombre: 'Polvo Compacto Traslúcido Mineral Velvet',
    precio: 62000,
    cantidad: 6,
    cantidadInicial: 18,
    totalProducto: 372000,
    categoria: 'ROSTRO',
  },
  {
    id: 4,
    nombre: 'Pomada Esculpidora de Cejas Brow Sculpt 24h',
    precio: 39000,
    cantidad: 1,
    cantidadInicial: 12,
    totalProducto: 39000,
    categoria: 'CEJAS',
  },
  {
    id: 5,
    nombre: 'Gel Fijador Transparente Brow Lamination Effect',
    precio: 34000,
    cantidad: 8,
    cantidadInicial: 10,
    totalProducto: 272000,
    categoria: 'CEJAS',
  },
  {
    id: 6,
    nombre: 'Lápiz Micro-Precisión de Cejas Hair-Like Strokes',
    precio: 32000,
    cantidad: 2,
    cantidadInicial: 20,
    totalProducto: 64000,
    categoria: 'CEJAS',
  },
  {
    id: 7,
    nombre: 'Labial Velvet Matte Rouge Rubí',
    precio: 45000,
    cantidad: 12,
    cantidadInicial: 15,
    totalProducto: 540000,
    categoria: 'LABIOS',
  },
  {
    id: 8,
    nombre: 'Tinta Labial Acuosa Nude Rose Long-Wear',
    precio: 38000,
    cantidad: 1,
    cantidadInicial: 10,
    totalProducto: 38000,
    categoria: 'LABIOS',
  },
  {
    id: 9,
    nombre: 'Brillo Hidratante Plumping Lip Oil Berry',
    precio: 42000,
    cantidad: 9,
    cantidadInicial: 12,
    totalProducto: 378000,
    categoria: 'LABIOS',
  },
  {
    id: 10,
    nombre: 'Paleta de Sombras Nude & Bronze 12 Tonos',
    precio: 110000,
    cantidad: 5,
    cantidadInicial: 10,
    totalProducto: 550000,
    categoria: 'OJOS',
  },
  {
    id: 11,
    nombre: 'Delineador Líquido Plumón Waterproof Intenso',
    precio: 36000,
    cantidad: 3,
    cantidadInicial: 30,
    totalProducto: 108000,
    categoria: 'OJOS',
  },
  {
    id: 12,
    nombre: 'Pestañina Máximo Volumen & Curvatura Lash Lift',
    precio: 52000,
    cantidad: 16,
    cantidadInicial: 20,
    totalProducto: 832000,
    categoria: 'OJOS',
  },
];

export const DEMO_ADMIN_USER: Usuario = {
  username: 'maryuri',
  fullName: 'Maryuri Admin (Dunamis Makeup)',
  role: 'ADMIN',
};

const STORAGE_KEY = 'dunamis_demo_inventory_v1';

const cloneInitialProducts = (): Producto[] =>
  INITIAL_DEMO_PRODUCTS.map((p) => ({ ...p }));

class DemoStore {
  private products: Producto[];

  constructor() {
    this.products = this.load();
  }

  private load(): Producto[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback if localStorage not available
    }
    return cloneInitialProducts();
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.products));
    } catch {
      // ignore
    }
  }

  public getProducts(): Producto[] {
    return [...this.products];
  }

  public getProductById(id: number): Producto | undefined {
    return this.products.find((p) => p.id === id);
  }

  public createProduct(input: ProductoInput): Producto {
    const nextId = this.products.length > 0 ? Math.max(...this.products.map((p) => p.id)) + 1 : 1;
    const newProduct: Producto = {
      id: nextId,
      nombre: input.nombre.trim(),
      precio: Number(input.precio),
      cantidad: Number(input.cantidad),
      cantidadInicial: Number(input.cantidad),
      totalProducto: Number(input.precio) * Number(input.cantidad),
      categoria: input.categoria,
    };
    this.products.push(newProduct);
    this.save();
    return newProduct;
  }

  public updateProduct(id: number, input: Partial<ProductoInput>): Producto {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Producto con ID ${id} no encontrado`);
    }
    const current = this.products[index];
    const updatedNombre = input.nombre !== undefined ? input.nombre.trim() : current.nombre;
    const updatedPrecio = input.precio !== undefined ? Number(input.precio) : current.precio;
    const updatedCantidad = input.cantidad !== undefined ? Number(input.cantidad) : current.cantidad;
    const updatedCategoria = input.categoria !== undefined ? input.categoria : current.categoria;

    const updated: Producto = {
      ...current,
      nombre: updatedNombre,
      precio: updatedPrecio,
      cantidad: updatedCantidad,
      categoria: updatedCategoria,
      totalProducto: updatedPrecio * updatedCantidad,
    };

    this.products[index] = updated;
    this.save();
    return updated;
  }

  public deleteProduct(id: number): Producto {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Producto con ID ${id} no encontrado`);
    }
    const [deleted] = this.products.splice(index, 1);
    this.save();
    return deleted;
  }

  public getTotalInventory(): number {
    return this.products.reduce((acc, p) => acc + (p.totalProducto || p.precio * p.cantidad), 0);
  }

  public getLowStockProducts(): Producto[] {
    return this.products.filter((p) => p.cantidad <= p.cantidadInicial * 0.1);
  }

  public createInvoice(input: FacturaInput): Factura {
    let total = 0;
    const detallesProcesados = [];

    for (const item of input.detalles) {
      const product = this.products.find((p) => p.id === item.producto.id);
      if (!product) {
        throw new Error(`Producto #${item.producto.id} no encontrado`);
      }
      if (product.cantidad < item.cantidad) {
        throw new Error(`Stock insuficiente para "${product.nombre}". Disponible: ${product.cantidad}`);
      }
      product.cantidad -= item.cantidad;
      product.totalProducto = product.cantidad * product.precio;
      const subtotal = item.cantidad * product.precio;
      total += subtotal;
      detallesProcesados.push({
        producto: { ...product },
        cantidad: item.cantidad,
        precioUnitario: product.precio,
        subtotal,
      });
    }

    this.save();
    return {
      id: Date.now(),
      fecha: new Date().toISOString(),
      totalFactura: total,
      detalles: detallesProcesados,
    };
  }

  public resetToDefaults(): void {
    this.products = cloneInitialProducts();
    this.save();
  }
}

export const demoStore = new DemoStore();
