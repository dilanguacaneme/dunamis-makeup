import type { Producto, ProductoInput, FacturaInput, Factura, Usuario, Marca, MarcaInput } from '../types';

export const INITIAL_DEMO_BRANDS: Marca[] = [
  { id: 1, nombre: 'Trendy', activa: true },
  { id: 2, nombre: 'Purpure', activa: true },
  { id: 3, nombre: 'Milagros', activa: true },
  { id: 4, nombre: 'Magna', activa: true },
];

const INITIAL_DEMO_PRODUCTS: Producto[] = [
  {
    id: 1,
    nombre: 'Base Fluida Satinada Glow Foundation',
    precio: 85000,
    cantidad: 2,
    cantidadInicial: 20,
    totalProducto: 170000,
    categoria: 'ROSTRO',
    marca: INITIAL_DEMO_BRANDS[1], // Purpure
  },
  {
    id: 2,
    nombre: 'Corrector Cremoso Alta Cobertura Radiant Concealer',
    precio: 48000,
    cantidad: 14,
    cantidadInicial: 15,
    totalProducto: 672000,
    categoria: 'ROSTRO',
    marca: INITIAL_DEMO_BRANDS[0], // Trendy
  },
  {
    id: 3,
    nombre: 'Polvo Compacto Traslúcido Mineral Velvet',
    precio: 62000,
    cantidad: 6,
    cantidadInicial: 18,
    totalProducto: 372000,
    categoria: 'ROSTRO',
    marca: INITIAL_DEMO_BRANDS[3], // Magna
  },
  {
    id: 4,
    nombre: 'Pomada Esculpidora de Cejas Brow Sculpt 24h',
    precio: 39000,
    cantidad: 0, // Demonstrates "Agotado" state
    cantidadInicial: 12,
    totalProducto: 0,
    categoria: 'CEJAS',
    marca: INITIAL_DEMO_BRANDS[2], // Milagros
  },
  {
    id: 5,
    nombre: 'Gel Fijador Transparente Brow Lamination Effect',
    precio: 34000,
    cantidad: 8,
    cantidadInicial: 10,
    totalProducto: 272000,
    categoria: 'CEJAS',
    marca: INITIAL_DEMO_BRANDS[0], // Trendy
  },
  {
    id: 6,
    nombre: 'Lápiz Micro-Precisión de Cejas Hair-Like Strokes',
    precio: 32000,
    cantidad: 2,
    cantidadInicial: 20,
    totalProducto: 64000,
    categoria: 'CEJAS',
    marca: INITIAL_DEMO_BRANDS[2], // Milagros
  },
  {
    id: 7,
    nombre: 'Labial Velvet Matte Rouge Rubí',
    precio: 45000,
    cantidad: 12,
    cantidadInicial: 15,
    totalProducto: 540000,
    categoria: 'LABIOS',
    marca: INITIAL_DEMO_BRANDS[1], // Purpure
  },
  {
    id: 8,
    nombre: 'Tinta Labial Acuosa Nude Rose Long-Wear',
    precio: 38000,
    cantidad: 1,
    cantidadInicial: 10,
    totalProducto: 38000,
    categoria: 'LABIOS',
    marca: INITIAL_DEMO_BRANDS[0], // Trendy
  },
  {
    id: 9,
    nombre: 'Brillo Hidratante Plumping Lip Oil Berry',
    precio: 42000,
    cantidad: 9,
    cantidadInicial: 12,
    totalProducto: 378000,
    categoria: 'LABIOS',
    marca: INITIAL_DEMO_BRANDS[3], // Magna
  },
  {
    id: 10,
    nombre: 'Paleta de Sombras Nude & Bronze 12 Tonos',
    precio: 110000,
    cantidad: 5,
    cantidadInicial: 10,
    totalProducto: 550000,
    categoria: 'OJOS',
    marca: INITIAL_DEMO_BRANDS[0], // Trendy
  },
  {
    id: 11,
    nombre: 'Delineador Líquido Plumón Waterproof Intenso',
    precio: 36000,
    cantidad: 3,
    cantidadInicial: 30,
    totalProducto: 108000,
    categoria: 'OJOS',
    marca: INITIAL_DEMO_BRANDS[1], // Purpure
  },
  {
    id: 12,
    nombre: 'Pestañina Máximo Volumen & Curvatura Lash Lift',
    precio: 52000,
    cantidad: 16,
    cantidadInicial: 20,
    totalProducto: 832000,
    categoria: 'OJOS',
    marca: INITIAL_DEMO_BRANDS[2], // Milagros
  },
];

const INITIAL_DEMO_INVOICES: Factura[] = [
  {
    id: 1001,
    cliente: 'Carolina Méndez',
    telefonoCliente: '312 450 7890',
    vendedorNombre: 'Maryuri Andrea Salazar',
    vendedorUsuario: 'maryuri',
    fecha: '2026-10-15',
    total: 133000,
    detalles: [
      {
        id: 1,
        producto: INITIAL_DEMO_PRODUCTS[0],
        cantidad: 1,
        subtotal: 85000,
      },
      {
        id: 2,
        producto: INITIAL_DEMO_PRODUCTS[1],
        cantidad: 1,
        subtotal: 48000,
      },
    ],
  },
  {
    id: 1002,
    cliente: 'Valeria Restrepo',
    telefonoCliente: '301 889 1234',
    vendedorNombre: 'Caterin Rojas Hererra',
    vendedorUsuario: 'caterin',
    fecha: '2026-10-16',
    total: 90000,
    detalles: [
      {
        id: 3,
        producto: INITIAL_DEMO_PRODUCTS[6],
        cantidad: 2,
        subtotal: 90000,
      },
    ],
  },
  {
    id: 1003,
    cliente: 'Lucía Fernández',
    telefonoCliente: '315 771 9900',
    vendedorNombre: 'Maryuri Andrea Salazar',
    vendedorUsuario: 'maryuri',
    fecha: '2026-10-16',
    total: 110000,
    detalles: [
      {
        id: 4,
        producto: INITIAL_DEMO_PRODUCTS[9],
        cantidad: 1,
        subtotal: 110000,
      },
    ],
  },
];

export const DEMO_ADMIN_USER: Usuario = {
  username: 'maryuri',
  fullName: 'Maryuri Andrea Salazar',
  role: 'ADMIN',
};

export const DEMO_SELLER_USER: Usuario = {
  username: 'caterin',
  fullName: 'Caterin Rojas Hererra',
  role: 'VENDEDOR',
};

const STORAGE_PRODUCTS_KEY = 'dunamis_demo_inventory_v2';
const STORAGE_BRANDS_KEY = 'dunamis_demo_brands_v2';
const STORAGE_INVOICES_KEY = 'dunamis_demo_invoices_v2';

class DemoStore {
  private products: Producto[];
  private brands: Marca[];
  private invoices: Factura[];

  constructor() {
    this.brands = this.loadBrands();
    this.products = this.loadProducts();
    this.invoices = this.loadInvoices();
  }

  // --- BRANDS ---
  private loadBrands(): Marca[] {
    try {
      const stored = localStorage.getItem(STORAGE_BRANDS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return INITIAL_DEMO_BRANDS.map((b) => ({ ...b }));
  }

  private saveBrands(): void {
    try {
      localStorage.setItem(STORAGE_BRANDS_KEY, JSON.stringify(this.brands));
    } catch {
      // ignore
    }
  }

  public getBrands(): Marca[] {
    return this.brands.filter((b) => b.activa !== false);
  }

  public getAllBrands(): Marca[] {
    return [...this.brands];
  }

  public createBrand(input: MarcaInput): Marca {
    const nombre = input.nombre.trim();
    if (!nombre) {
      throw new Error('El nombre de la marca es obligatorio');
    }
    const exists = this.brands.some((b) => b.nombre.toLowerCase() === nombre.toLowerCase());
    if (exists) {
      throw new Error('Ya existe una marca con ese nombre');
    }
    const nextId = this.brands.length > 0 ? Math.max(...this.brands.map((b) => b.id)) + 1 : 1;
    const newBrand: Marca = {
      id: nextId,
      nombre,
      activa: true,
    };
    this.brands.push(newBrand);
    this.saveBrands();
    return newBrand;
  }

  public updateBrand(id: number, input: Partial<MarcaInput>): Marca {
    const brand = this.brands.find((b) => b.id === id);
    if (!brand) {
      throw new Error('Marca no encontrada');
    }
    if (input.nombre !== undefined) {
      const nombre = input.nombre.trim();
      if (!nombre) {
        throw new Error('El nombre de la marca es obligatorio');
      }
      const duplicate = this.brands.some(
        (b) => b.id !== id && b.nombre.toLowerCase() === nombre.toLowerCase()
      );
      if (duplicate) {
        throw new Error('Ya existe una marca con ese nombre');
      }
      brand.nombre = nombre;
    }
    if (input.activa !== undefined) {
      brand.activa = input.activa;
    }
    this.saveBrands();
    return brand;
  }

  // --- PRODUCTS ---
  private loadProducts(): Producto[] {
    try {
      const stored = localStorage.getItem(STORAGE_PRODUCTS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return INITIAL_DEMO_PRODUCTS.map((p) => ({ ...p }));
  }

  private saveProducts(): void {
    try {
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(this.products));
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
    if (input.cantidad < 0) {
      throw new Error('Las existencias deben ser cero o más');
    }
    if (!input.marca?.id) {
      throw new Error('Seleccione una marca para el producto');
    }
    const marca = this.brands.find((b) => b.id === input.marca?.id && b.activa !== false);
    if (!marca) {
      throw new Error('La marca seleccionada no existe o está inactiva');
    }

    const nextId = this.products.length > 0 ? Math.max(...this.products.map((p) => p.id)) + 1 : 1;
    const newProduct: Producto = {
      id: nextId,
      nombre: input.nombre.trim(),
      precio: Number(input.precio),
      cantidad: Math.max(0, Number(input.cantidad)),
      cantidadInicial: Math.max(0, Number(input.cantidad)),
      totalProducto: Number(input.precio) * Math.max(0, Number(input.cantidad)),
      categoria: input.categoria,
      marca,
    };
    this.products.push(newProduct);
    this.saveProducts();
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
    let updatedCantidad = current.cantidad;
    if (input.cantidad !== undefined) {
      if (Number(input.cantidad) < 0) {
        throw new Error('Las existencias no pueden ser negativas');
      }
      updatedCantidad = Number(input.cantidad);
    }
    const updatedCategoria = input.categoria !== undefined ? input.categoria : current.categoria;

    let updatedMarca = current.marca;
    if (input.marca?.id) {
      const foundMarca = this.brands.find((b) => b.id === input.marca?.id && b.activa !== false);
      if (!foundMarca) {
        throw new Error('La marca seleccionada no existe o está inactiva');
      }
      updatedMarca = foundMarca;
    }

    const updated: Producto = {
      ...current,
      nombre: updatedNombre,
      precio: updatedPrecio,
      cantidad: updatedCantidad,
      categoria: updatedCategoria,
      marca: updatedMarca,
      totalProducto: updatedPrecio * updatedCantidad,
    };

    this.products[index] = updated;
    this.saveProducts();
    return updated;
  }

  public deleteProduct(id: number): Producto {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Producto con ID ${id} no encontrado`);
    }
    const [deleted] = this.products.splice(index, 1);
    this.saveProducts();
    return deleted;
  }

  public getTotalInventory(): number {
    return this.products.reduce((acc, p) => acc + (p.totalProducto || p.precio * p.cantidad), 0);
  }

  public getLowStockProducts(): Producto[] {
    // Backend GET /producto/acabarse returns products where cantidad = 0
    return this.products.filter((p) => p.cantidad === 0);
  }

  // --- INVOICES ---
  private loadInvoices(): Factura[] {
    try {
      const stored = localStorage.getItem(STORAGE_INVOICES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return INITIAL_DEMO_INVOICES.map((inv) => ({ ...inv }));
  }

  private saveInvoices(): void {
    try {
      localStorage.setItem(STORAGE_INVOICES_KEY, JSON.stringify(this.invoices));
    } catch {
      // ignore
    }
  }

  public getInvoices(userRole?: string, username?: string): Factura[] {
    if (userRole === 'VENDEDOR' && username) {
      return this.invoices.filter(
        (inv) => (inv.vendedorUsuario || '').toLowerCase() === username.toLowerCase()
      );
    }
    return [...this.invoices];
  }

  public getInvoiceById(id: number, userRole?: string, username?: string): Factura {
    const invoice = this.invoices.find((inv) => inv.id === id);
    if (!invoice) {
      throw new Error('Factura no encontrada');
    }
    if (
      userRole === 'VENDEDOR' &&
      username &&
      (invoice.vendedorUsuario || '').toLowerCase() !== username.toLowerCase()
    ) {
      throw new Error('No tienes autorización para ver esta factura');
    }
    return invoice;
  }

  public createInvoice(input: FacturaInput, currentUser?: Usuario | null): Factura {
    if (!input.cliente || !input.cliente.trim()) {
      throw new Error('El nombre del cliente es obligatorio');
    }
    if (!input.detalles || input.detalles.length === 0) {
      throw new Error('La factura debe tener al menos un producto');
    }

    let total = 0;
    const detallesProcesados = [];

    for (const item of input.detalles) {
      if (!item.cantidad || item.cantidad <= 0) {
        throw new Error('La cantidad de cada producto debe ser mayor que cero');
      }
      const product = this.products.find((p) => p.id === item.producto.id);
      if (!product) {
        throw new Error(`Producto #${item.producto.id} no encontrado`);
      }
      if (product.cantidad < item.cantidad) {
        throw new Error(`Stock insuficiente para "${product.nombre}". Disponible: ${product.cantidad} unidades.`);
      }

      product.cantidad -= item.cantidad;
      product.totalProducto = product.cantidad * product.precio;
      const subtotal = item.cantidad * product.precio;
      total += subtotal;

      detallesProcesados.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        producto: { ...product },
        cantidad: item.cantidad,
        subtotal,
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const nextId = this.invoices.length > 0 ? Math.max(...this.invoices.map((i) => i.id)) + 1 : 1001;

    const newInvoice: Factura = {
      id: nextId,
      cliente: input.cliente.trim(),
      telefonoCliente: input.telefonoCliente ? input.telefonoCliente.trim() : '',
      vendedorNombre: currentUser?.fullName || 'Maryuri Andrea Salazar',
      vendedorUsuario: currentUser?.username || 'maryuri',
      fecha: today,
      total,
      detalles: detallesProcesados,
    };

    this.invoices.unshift(newInvoice);
    this.saveInvoices();
    this.saveProducts();
    return newInvoice;
  }

  public resetToDefaults(): void {
    this.brands = INITIAL_DEMO_BRANDS.map((b) => ({ ...b }));
    this.products = INITIAL_DEMO_PRODUCTS.map((p) => ({ ...p }));
    this.invoices = INITIAL_DEMO_INVOICES.map((i) => ({ ...i }));
    this.saveBrands();
    this.saveProducts();
    this.saveInvoices();
  }
}

export const demoStore = new DemoStore();
